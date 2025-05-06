require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/user');
const testRoutes = require('./src/routes/test');
const gameRoutes = require('./src/routes/game');
const logRoutes = require('./src/routes/log');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes - these should come before static file serving
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/test', testRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/log', logRoutes);

// Error handling middleware for API routes
app.use('/api', (err, req, res, next) => {
    console.error('API error:', err);
    
    // Ensure proper headers
    res.setHeader('Content-Type', 'application/json');
    
    // Handle different types of errors
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ 
            error: 'Invalid JSON',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
    
    return res.status(500).json({ 
        error: 'Server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Static file serving - this should come after API routes
app.use(express.static('public'));

// Catch-all route for SPA - this should be last
app.get('*', (req, res) => {
    // Only serve index.html for non-API routes
    if (!req.path.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        res.status(404).json({ error: 'API endpoint not found' });
    }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

// For Vercel
module.exports = app; 