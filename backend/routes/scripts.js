const express = require('express');
const router = express.Router();

module.exports = (db) => {
    // GET all scripts
    router.get('/', async (req, res) => {
        try {
            const scripts = await db.all('SELECT * FROM scripts ORDER BY created_at DESC');
            res.json(scripts);
        } catch (err) {
            res.status(500).json({ error: 'Failed to fetch scripts' });
        }
    });

    // POST create script
    router.post('/', async (req, res) => {
        const { name, content, source_link, notes } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        try {
            const result = await db.run(
                'INSERT INTO scripts (name, content, source_link, notes) VALUES (?, ?, ?, ?)',
                [name, content, source_link, notes]
            );
            res.json({ id: result.lastID, name, content, source_link, notes });
        } catch (err) {
            res.status(500).json({ error: 'Failed to save script' });
        }
    });

    // DELETE script
    router.delete('/:id', async (req, res) => {
        try {
            await db.run('DELETE FROM scripts WHERE id = ?', [req.params.id]);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: 'Failed to delete script' });
        }
    });

    return router;
};
