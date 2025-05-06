const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Submit test result
router.post('/submit', auth, async (req, res) => {
    try {
        const { wpm, accuracy, timeLimit } = req.body;

        // Add to test history
        req.user.testHistory.push({
            wpm,
            accuracy,
            timeLimit,
            date: new Date()
        });

        // Update user stats
        const totalTests = req.user.stats.totalTests + 1;
        const newAverageWPM = (req.user.stats.averageWPM * req.user.stats.totalTests + wpm) / totalTests;
        const newAverageAccuracy = (req.user.stats.averageAccuracy * req.user.stats.totalTests + accuracy) / totalTests;

        req.user.stats.totalTests = totalTests;
        req.user.stats.averageWPM = Math.round(newAverageWPM * 100) / 100;
        req.user.stats.averageAccuracy = Math.round(newAverageAccuracy * 100) / 100;

        if (wpm > req.user.stats.highestWPM) {
            req.user.stats.highestWPM = wpm;
            
            // Check for achievements
            if (wpm >= 100 && !req.user.achievements.find(a => a.name === 'Speed Demon')) {
                req.user.achievements.push({
                    name: 'Speed Demon',
                    description: 'Reached 100 WPM',
                    dateEarned: new Date(),
                    badge: '🏃'
                });
            }
        }

        // Check for test completion achievements
        if (req.user.stats.totalTests === 10 && !req.user.achievements.find(a => a.name === 'Dedicated Typist')) {
            req.user.achievements.push({
                name: 'Dedicated Typist',
                description: 'Completed 10 typing tests',
                dateEarned: new Date(),
                badge: '🎯'
            });
        }

        await req.user.save();
        res.json({
            testResult: req.user.testHistory[req.user.testHistory.length - 1],
            stats: req.user.stats,
            achievements: req.user.achievements
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get random text for typing test
router.get('/text', async (req, res) => {
    const texts = [
        "The quick brown fox jumps over the lazy dog.",
        "To be or not to be, that is the question.",
        "All that glitters is not gold.",
        "A journey of a thousand miles begins with a single step.",
        "Practice makes perfect, but nobody's perfect, so why practice?"
    ];
    
    const randomText = texts[Math.floor(Math.random() * texts.length)];
    res.json({ text: randomText });
});

module.exports = router; 