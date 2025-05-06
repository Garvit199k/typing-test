const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Submit game score
router.post('/score', auth, async (req, res) => {
    try {
        const { score } = req.body;

        // Update high score if new score is higher
        if (score > req.user.gameStats.highScore) {
            req.user.gameStats.highScore = score;
        }

        // Increment games played
        req.user.gameStats.gamesPlayed += 1;

        // Check for game achievements
        if (score >= 1000 && !req.user.achievements.find(a => a.name === 'Game Master')) {
            req.user.achievements.push({
                name: 'Game Master',
                description: 'Scored 1000 points in Dog Rescue',
                dateEarned: new Date(),
                badge: '🎮'
            });
        }

        await req.user.save();
        res.json({
            gameStats: req.user.gameStats,
            achievements: req.user.achievements
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get game leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const users = await User.find({})
            .select('username gameStats.highScore')
            .sort({ 'gameStats.highScore': -1 })
            .limit(10);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router; 