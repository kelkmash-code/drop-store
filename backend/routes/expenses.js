const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

module.exports = (db) => {
    // GET / - List all expenses (Admin only)
    router.get('/', auth, async (req, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
        try {
            const expenses = await db.all('SELECT * FROM expenses ORDER BY created_at DESC');
            res.json(expenses);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // POST / - Create new expense (Admin only)
    router.post('/', auth, async (req, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
        const { title, amount, category, notes } = req.body;

        if (!title || !amount) {
            return res.status(400).json({ error: 'Title and amount are required' });
        }

        try {
            const result = await db.run(
                'INSERT INTO expenses (title, amount, category, notes, created_by) VALUES (?, ?, ?, ?, ?)',
                [title, amount, category, notes, req.user.id]
            );
            res.status(201).json({ id: result.lastID, success: true });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // DELETE /:id - Delete expense (Admin only)
    router.delete('/:id', auth, async (req, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
        try {
            await db.run('DELETE FROM expenses WHERE id = ?', [req.params.id]);
            res.json({ success: true });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    return router;
};
