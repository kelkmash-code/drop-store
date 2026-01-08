const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

module.exports = (db) => {
    // GET /api/chat?channel=global&after=TIMESTAMP
    // Polling endpoint to get new messages
    router.get('/', auth, async (req, res) => {
        try {
            const { channel = 'global', after } = req.query;
            let query = `
                SELECT m.*, u.username as sender_name, u.role as sender_role 
                FROM messages m 
                JOIN users u ON m.sender_id = u.id 
                WHERE m.channel = ? 
            `;
            const params = [channel];

            if (after) {
                query += ` AND m.created_at > ?`;
                params.push(after);
            }

            query += ` ORDER BY m.created_at ASC LIMIT 50`;

            const messages = await db.all(query, params);
            res.json(messages);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // POST /api/chat
    // Send a message
    router.post('/', auth, async (req, res) => {
        try {
            const { content, channel = 'global' } = req.body;

            if (!content || !content.trim()) {
                return res.status(400).json({ error: 'Message cannot be empty' });
            }

            // Using RETURNING id for Postgres compatibility via adapter logic or expecting db.run to handle it
            // Ideally our db-adapter handles generic INSERTs, but if not we can do a fetch after.
            // For simplicity and compatibility, we'll insert then fetch the last one or rely on client to fetch next poll.

            // Standardizing timestamp: use DB current time
            await db.run(
                'INSERT INTO messages (sender_id, channel, content) VALUES (?, ?, ?)',
                [req.user.id, channel, content.trim()]
            );

            res.json({ success: true });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to send message' });
        }
    });

    return router;
};
