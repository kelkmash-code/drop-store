const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

module.exports = (db) => {
    // POST /reset - Wipe Database (Danger Zone)
    router.post('/reset', auth, async (req, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

        try {
            // Delete transactional data
            await db.run('DELETE FROM order_history');
            await db.run('DELETE FROM fruit_orders');
            await db.run('DELETE FROM eldorado_orders');
            await db.run('DELETE FROM local_orders');
            await db.run('DELETE FROM work_sessions');
            await db.run('DELETE FROM expenses');
            // Reset sequences if applicable (SQLite specific usually, PG handles SERIAL automatically on truncate usually, but delete doesn't reset serial. That's fine.)

            // Optionally reset default fruits stock
            // await db.run('UPDATE blox_fruits SET quantity = 0'); 
            // User asked for "Clean System", resetting stock makes sense.
            await db.run('UPDATE blox_fruits SET quantity = 0');

            res.json({ success: true, message: 'System reset successfully' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error during reset' });
        }
    });

    return router;
};
