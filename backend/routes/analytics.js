const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

module.exports = (db) => {

    // Helper: Get query for a date range
    async function getStatsForDate(date) {
        // SQLite date function usage
        // Note: created_at is UTC in DB usually.
        // We will match just the YYYY-MM-DD part.

        const orders = await db.all(
            `SELECT * FROM local_orders WHERE date(created_at) = date(?)`,
            [date]
        );

        const revenue = orders.reduce((sum, o) => sum + (o.accepted_price || 0), 0);
        const completed = orders.filter(o => o.status === 'Completed').length;
        const newOrders = orders.length;

        // Breakdown by type
        const byType = {};
        orders.forEach(o => {
            const type = o.order_type || 'Leveling';
            byType[type] = (byType[type] || 0) + 1;
        });

        return { date, revenue, completed, newOrders, byType };
    }

    // GET /daily?date=YYYY-MM-DD
    router.get('/daily', auth, async (req, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

        try {
            const today = new Date().toISOString().split('T')[0];
            const date = req.query.date || today;
            const stats = await getStatsForDate(date);
            res.json(stats);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // GET /weekly
    router.get('/weekly', auth, async (req, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

        try {
            const today = new Date().toISOString().split('T')[0];
            const endDate = req.query.date || today;
            const days = 7;
            const stats = [];

            for (let i = 0; i < days; i++) {
                const d = new Date(endDate);
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                const dayStats = await getStatsForDate(dateStr);
                stats.push(dayStats);
            }

            // Return oldest to newest
            res.json(stats.reverse());
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Get worker performance stats
    router.get('/workers', auth, async (req, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

        try {
            const stats = await db.all(`
                SELECT 
                    u.id, 
                    u.username,
                    COUNT(lo.id) as total_orders,
                    SUM(CASE WHEN lo.status = 'Completed' THEN 1 ELSE 0 END) as completed_orders,
                    SUM(CASE WHEN lo.status = 'Completed' THEN lo.accepted_price ELSE 0 END) as revenue_generated
                FROM users u
                LEFT JOIN local_orders lo ON u.id = lo.assigned_worker_id
                WHERE u.role IN ('worker', 'admin')
                GROUP BY u.id
            `);

            // Fetch session data separately to avoid complex joins
            for (let stat of stats) {
                const sessionData = await db.get(`
                    SELECT 
                        SUM(duration_minutes) as total_minutes
                    FROM work_sessions 
                    WHERE user_id = ?
                `, [stat.id]);

                const totalMinutes = sessionData?.total_minutes || 0;
                const hours = totalMinutes / 60;

                stat.hours_worked = parseFloat(hours.toFixed(2));
                stat.orders_per_hour = hours > 0
                    ? parseFloat((stat.completed_orders / hours).toFixed(2))
                    : 0;
            }

            res.json(stats);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    return router;
};
