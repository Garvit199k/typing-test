const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Error log schema
const errorLogSchema = new mongoose.Schema({
    message: String,
    error: String,
    stack: String,
    timestamp: Date,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    userAgent: String,
    path: String
}, { timestamps: true });

const ErrorLog = mongoose.model('ErrorLog', errorLogSchema);

// Error logging endpoint
router.post('/error', async (req, res) => {
    try {
        const errorLog = new ErrorLog({
            message: req.body.message,
            error: req.body.error,
            stack: req.body.stack,
            timestamp: req.body.timestamp,
            userId: req.body.userId,
            userAgent: req.body.userAgent,
            path: req.body.path
        });

        await errorLog.save();
        res.status(200).json({ message: 'Error logged successfully' });
    } catch (error) {
        console.error('Error saving error log:', error);
        res.status(500).json({ message: 'Failed to log error' });
    }
});

module.exports = router; 