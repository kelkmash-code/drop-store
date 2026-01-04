const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = (db) => {
    // Login
    router.post('/login', async (req, res) => {
        const { username, password } = req.body;
        try {
            const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
            if (!user) return res.status(401).json({ error: 'Invalid credentials' });

            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

            // Create new session
            await db.run('INSERT INTO work_sessions (user_id, login_time) VALUES (?, datetime("now"))', [user.id]);

            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );

            res.json({
                token,
                user: { id: user.id, username: user.username, role: user.role }
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Logout
    router.post('/logout', async (req, res) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) return res.json({ success: true }); // Just invalid token, ignore

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Close the latest open session for this user
            const session = await db.get(
                'SELECT id FROM work_sessions WHERE user_id = ? AND logout_time IS NULL ORDER BY id DESC LIMIT 1',
                [decoded.id]
            );

            if (session) {
                await db.run(`
                    UPDATE work_sessions 
                    SET logout_time = datetime('now'),
                        duration_minutes = (strftime('%s', 'now') - strftime('%s', login_time)) / 60
                    WHERE id = ?
                `, [session.id]);
            }
            res.json({ success: true });
        } catch (err) {
            console.error('Logout error:', err);
            res.json({ success: true }); // Still return success to frontend
        }
    });

    // Get current user (with token)
    router.get('/me', async (req, res) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) return res.status(401).json({ error: 'No token' });

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await db.get('SELECT id, username, role FROM users WHERE id = ?', [decoded.id]);
            if (!user) return res.status(404).json({ error: 'User not found' });
            res.json(user);
        } catch (err) {
            res.status(401).json({ error: 'Invalid token' });
        }
    });

    return router;
};
