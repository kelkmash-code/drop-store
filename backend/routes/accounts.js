const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

module.exports = (db) => {
    // GET / - List all accounts
    router.get('/', auth, async (req, res) => {
        try {
            // Admin sees all, worker sees only active? 
            // Implementation plan says Admin-only management, but worker needs to see list for selection.
            let query = 'SELECT * FROM aldorado_accounts ORDER BY name ASC';
            if (req.user.role !== 'admin') {
                query = 'SELECT * FROM aldorado_accounts WHERE is_active = 1 ORDER BY name ASC';
            }
            const accounts = await db.all(query);
            res.json(accounts);
        } catch (err) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    // POST / - Add new account (Admin only)
    router.post('/', auth, async (req, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
        const { name, email } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        try {
            await db.run(
                'INSERT INTO aldorado_accounts (name, email) VALUES (?, ?)',
                [name, email]
            );
            res.json({ success: true });
        } catch (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Account name already exists' });
            }
            res.status(500).json({ error: 'Server error' });
        }
    });

    // PATCH /:id/toggle - Toggle active status (Admin only)
    router.patch('/:id/toggle', auth, async (req, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
        try {
            const account = await db.get('SELECT is_active FROM aldorado_accounts WHERE id = ?', [req.params.id]);
            if (!account) return res.status(404).json({ error: 'Account not found' });

            await db.run('UPDATE aldorado_accounts SET is_active = ? WHERE id = ?', [!account.is_active, req.params.id]);
            res.json({ success: true, is_active: !account.is_active });
        } catch (err) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    // DELETE /:id - Delete account (Admin only)
    router.delete('/:id', auth, async (req, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
        try {
            await db.run('DELETE FROM aldorado_accounts WHERE id = ?', [req.params.id]);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    return router;
};
