const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

module.exports = (db) => {
    // GET / - List campaigns with user progress
    router.get('/', auth, async (req, res) => {
        try {
            const campaigns = await db.all('SELECT * FROM campaigns WHERE is_active = 1 OR ? = "admin" ORDER BY created_at DESC', [req.user.role]);

            // Calculate progress for each campaign for the current user (if worker)
            const campaignsWithProgress = await Promise.all(campaigns.map(async (c) => {
                let progress = 0;

                if (req.user.role === 'worker') {
                    if (c.type === 'order_count') {
                        // Count completed orders assigned to this worker within date range
                        const result = await db.get(
                            `SELECT COUNT(*) as count FROM local_orders 
                             WHERE assigned_worker_id = ? 
                             AND status = 'Completed'
                             AND (completed_at BETWEEN ? AND ?)`,
                            [req.user.id, c.start_date, c.end_date]
                        );
                        progress = result.count;
                    } else if (c.type === 'revenue_sum') {
                        const result = await db.get(
                            `SELECT SUM(accepted_price) as total FROM local_orders 
                             WHERE assigned_worker_id = ? 
                             AND status = 'Completed'
                             AND (completed_at BETWEEN ? AND ?)`,
                            [req.user.id, c.start_date, c.end_date]
                        );
                        progress = result.total || 0;
                    }
                }

                return {
                    ...c,
                    userProgress: progress,
                    isCompleted: progress >= c.target_value
                };
            }));

            res.json(campaignsWithProgress);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // POST / - Create Campaign (Admin)
    router.post('/', auth, async (req, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

        const { title, description, type, target_value, reward, start_date, end_date } = req.body;

        try {
            await db.run(
                `INSERT INTO campaigns (title, description, type, target_value, reward, start_date, end_date)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [title, description, type, target_value, reward, start_date, end_date]
            );
            res.json({ success: true });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // POST /:id/toggle - Toggle Status (Admin)
    router.post('/:id/toggle', auth, async (req, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

        try {
            const campaign = await db.get('SELECT is_active FROM campaigns WHERE id = ?', [req.params.id]);
            if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

            await db.run('UPDATE campaigns SET is_active = ? WHERE id = ?', [!campaign.is_active, req.params.id]);
            res.json({ success: true, newStatus: !campaign.is_active });
        } catch (err) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    // DELETE /:id
    router.delete('/:id', auth, async (req, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
        try {
            await db.run('DELETE FROM campaigns WHERE id = ?', [req.params.id]);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    return router;
};
