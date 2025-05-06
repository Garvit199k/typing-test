const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user profile
router.patch('/profile', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['profile', 'preferences'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).json({ error: 'Invalid updates' });
    }

    try {
        updates.forEach(update => req.user[update] = req.body[update]);
        await req.user.save();
        res.json(req.user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get user statistics
router.get('/stats', auth, async (req, res) => {
    try {
        res.json(req.user.stats);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user test history
router.get('/history', auth, async (req, res) => {
    try {
        res.json(req.user.testHistory);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user achievements
router.get('/achievements', auth, async (req, res) => {
    try {
        res.json(req.user.achievements);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const users = await User.find({})
            .select('username stats.highestWPM stats.averageWPM')
            .sort({ 'stats.highestWPM': -1 })
            .limit(10);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router; 