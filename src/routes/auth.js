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
        // Set content type header
        res.setHeader('Content-Type', 'application/json');

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

        // Create new user using Vercel KV User model
        try {
            const user = await User.create({
                username: req.body.username,
                password: req.body.password,
                preferences: {
                    theme: req.body.preferences?.theme || 'light'
                }
            });

            // Generate token
            const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
                expiresIn: '7d'
            });

            return res.status(201).json({ token, user });
        } catch (error) {
            if (error.message === 'Username already exists') {
                return res.status(400).json({ error: 'Username already exists' });
            }
            throw error;
        }
    } catch (error) {
        console.error('Registration error:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        return res.status(500).json({ 
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
        // Set content type header
        res.setHeader('Content-Type', 'application/json');

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
        const isMatch = await User.comparePassword(user, password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });

        // Remove password from user object before sending
        const { password: _, ...userWithoutPassword } = user;
        return res.json({ token, user: userWithoutPassword });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ 
            error: 'Server error',
            message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
        });
    }
});

module.exports = router; 