const { kv } = require('@vercel/kv');
const bcrypt = require('bcryptjs');

class User {
    static async create(userData) {
        const { username, password, preferences = {} } = userData;
        
        // Check if user exists
        const existingUser = await kv.get(`user:${username}`);
        if (existingUser) {
            throw new Error('Username already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user object
        const user = {
            id: `user_${Date.now()}`,
            username,
            password: hashedPassword,
            preferences: {
                theme: preferences.theme || 'light'
            },
            stats: {
                averageWPM: 0,
                highestWPM: 0,
                totalTests: 0,
                averageAccuracy: 0
            },
            createdAt: new Date().toISOString()
        };

        // Store in Vercel KV
        await kv.set(`user:${username}`, user);
        await kv.set(`userid:${user.id}`, username);

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    static async findOne({ username }) {
        return await kv.get(`user:${username}`);
    }

    static async findById(id) {
        const username = await kv.get(`userid:${id}`);
        if (!username) return null;
        return await kv.get(`user:${username}`);
    }

    static async comparePassword(user, candidatePassword) {
        return await bcrypt.compare(candidatePassword, user.password);
    }

    static async updateStats(username, testResults) {
        const user = await kv.get(`user:${username}`);
        if (!user) return null;

        const { wpm, accuracy } = testResults;
        const totalTests = user.stats.totalTests + 1;
        
        user.stats = {
            averageWPM: ((user.stats.averageWPM * user.stats.totalTests) + wpm) / totalTests,
            highestWPM: Math.max(user.stats.highestWPM, wpm),
            totalTests,
            averageAccuracy: ((user.stats.averageAccuracy * (totalTests - 1)) + accuracy) / totalTests
        };

        await kv.set(`user:${username}`, user);
        return user;
    }
}

module.exports = User; 