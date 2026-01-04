const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');

module.exports = (db) => {
    // Get all users
    router.get('/', auth, async (req, res) => {
        try {
            // allow workers to see list for "assign to" if needed, or restrict to admin?
            // OrderModal fetches users. Let's allow authenticated users.
            const users = await db.all('SELECT id, username, role FROM users');
            res.json(users);
        } catch (err) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Create new user (Admin only)
    router.post('/', auth, async (req, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

        const { username, password, role } = req.body;
        if (!username || !password || !role) {
            return res.status(400).json({ error: 'All fields required' });
        }

        try {
            const hash = await bcrypt.hash(password, 10);
            await db.run(
                'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
                [username, hash, role]
            );
            res.json({ success: true });
        } catch (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Username already exists' });
            }
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Delete user (Admin only)
    router.delete('/:id', auth, async (req, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

        // Prevent deleting yourself
        if (parseInt(req.params.id) === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        try {
            await db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    return router;
};
