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

        // Log the entire request for debugging
        console.log('Registration request:', {
            body: req.body,
            headers: req.headers,
            path: req.path
        });

        // Validate request body
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ error: 'Invalid request body' });
        }

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

            // Log successful registration
            console.log('Registration successful:', {
                username: user.username,
                id: user.id
            });

            return res.status(201).json({ token, user });
        } catch (error) {
            console.error('User creation error:', error);
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

        // Log the login attempt
        console.log('Login attempt:', {
            username: req.body.username,
            headers: req.headers
        });

        // Validate request body
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

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

        // Log successful login
        console.log('Login successful:', {
            username: user.username,
            id: user.id
        });

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