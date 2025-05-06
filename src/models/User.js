const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    profile: {
        name: String,
        avatar: String,
        bio: String
    },
    stats: {
        averageWPM: { type: Number, default: 0 },
        highestWPM: { type: Number, default: 0 },
        totalTests: { type: Number, default: 0 },
        averageAccuracy: { type: Number, default: 0 }
    },
    achievements: [{
        name: String,
        description: String,
        dateEarned: Date,
        badge: String
    }],
    preferences: {
        theme: { type: String, default: 'light' },
        gender: { type: String, enum: ['male', 'female', 'other'] }
    },
    testHistory: [{
        wpm: Number,
        accuracy: Number,
        timeLimit: Number,
        date: { type: Date, default: Date.now }
    }],
    gameStats: {
        highScore: { type: Number, default: 0 },
        gamesPlayed: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema); 