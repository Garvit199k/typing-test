const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Registration route
router.post('/register', [
    body('username').trim().isLength({ min: 3 }).escape(),
    body('password').isLength({ min: 6 })
], async (req, res) => {
    try {
        console.log('Registration attempt:', { 
            username: req.body.username, 
            preferences: req.body.preferences,
            bodyKeys: Object.keys(req.body)
        });
        
        // Validate request body
        if (!req.body.username || !req.body.password) {
            console.log('Missing required fields');
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            return res.status(400).json({ 
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { username, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            console.log('Username already exists:', username);
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Create new user
        const user = new User({
            username,
            password,
            preferences: {
                theme: req.body.preferences?.theme || 'light'
            }
        });

        console.log('Attempting to save user:', { 
            username, 
            theme: user.preferences.theme,
            hasPassword: !!password
        });

        await user.save();
        console.log('User saved successfully:', user._id);

        // Generate token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });

        res.status(201).json({ 
            token, 
            user: { 
                id: user._id, 
                username: user.username,
                preferences: user.preferences
            } 
        });
    } catch (error) {
        console.error('Registration error:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        if (error.name === 'MongoServerError' && error.code === 11000) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        res.status(500).json({ 
            error: 'Server error',
            message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
        });
    }
});

// Login route
router.post('/login', [
    body('username').trim().isLength({ min: 3 }).escape(),
    body('password').exists()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });

        res.json({ token, user: { id: user._id, username: user.username } });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router; 