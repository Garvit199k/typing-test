const { kv } = require('@vercel/kv');
const bcrypt = require('bcryptjs');

class User {
    static async create(userData) {
        try {
            const { username, password, preferences = {} } = userData;
            
            if (!username || !password) {
                throw new Error('Username and password are required');
            }

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
            await kv.set(`user:${username}`, JSON.stringify(user));
            await kv.set(`userid:${user.id}`, username);

            // Return user without password
            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        } catch (error) {
            console.error('User creation error:', error);
            throw error;
        }
    }

    static async findOne({ username }) {
        try {
            const user = await kv.get(`user:${username}`);
            return typeof user === 'string' ? JSON.parse(user) : user;
        } catch (error) {
            console.error('Find user error:', error);
            throw error;
        }
    }

    static async findById(id) {
        try {
            const username = await kv.get(`userid:${id}`);
            if (!username) return null;
            const user = await kv.get(`user:${username}`);
            return typeof user === 'string' ? JSON.parse(user) : user;
        } catch (error) {
            console.error('Find user by ID error:', error);
            throw error;
        }
    }

    static async comparePassword(user, candidatePassword) {
        try {
            return await bcrypt.compare(candidatePassword, user.password);
        } catch (error) {
            console.error('Password comparison error:', error);
            throw error;
        }
    }

    static async updateStats(username, testResults) {
        try {
            const user = await kv.get(`user:${username}`);
            if (!user) return null;

            const parsedUser = typeof user === 'string' ? JSON.parse(user) : user;
            const { wpm, accuracy } = testResults;
            const totalTests = parsedUser.stats.totalTests + 1;
            
            parsedUser.stats = {
                averageWPM: ((parsedUser.stats.averageWPM * parsedUser.stats.totalTests) + wpm) / totalTests,
                highestWPM: Math.max(parsedUser.stats.highestWPM, wpm),
                totalTests,
                averageAccuracy: ((parsedUser.stats.averageAccuracy * (totalTests - 1)) + accuracy) / totalTests
            };

            await kv.set(`user:${username}`, JSON.stringify(parsedUser));
            return parsedUser;
        } catch (error) {
            console.error('Update stats error:', error);
            throw error;
        }
    }
}

module.exports = User; 