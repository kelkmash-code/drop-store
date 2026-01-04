const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

module.exports = (db) => {
    // Helper to generate Order ID
    async function generateOrderId() {
        const count = await db.get('SELECT COUNT(*) as count FROM local_orders');
        const nextId = (count.count + 1).toString().padStart(4, '0');
        return `ORD-${nextId}`;
    }

    // GET all orders (Filtered)
    router.get('/', auth, async (req, res) => {
        try {
            let query = 'SELECT o.*, u.username as worker_name FROM local_orders o LEFT JOIN users u ON o.assigned_worker_id = u.id';
            const params = [];

            if (req.user.role === 'worker') {
                query += ' WHERE o.assigned_worker_id = ? OR o.assigned_worker_id IS NULL';
                params.push(req.user.id);
            }

            const orders = await db.all(query, params);

            // Remove financial fields for workers if needed, 
            // but requirement says "Cannot edit", let's check if they can "view".
            // "Worker: Cannot edit accepted price or financial fields". 
            // It doesn't explicitly say they can't view, but usually financial info is sensitive.
            // I'll keep them for now but prevent editing.

            res.json(orders);
        } catch (err) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    // GET /accounts - List distinct aldorado accounts
    router.get('/accounts', auth, async (req, res) => {
        try {
            const accounts = await db.all('SELECT DISTINCT aldorado_account FROM local_orders WHERE aldorado_account IS NOT NULL AND aldorado_account != ""');
            res.json(accounts.map(a => a.aldorado_account));
        } catch (err) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    // CREATE local order
    router.post('/', auth, async (req, res) => {
        if (req.user.role !== 'admin' && req.user.role !== 'worker') {
            return res.status(403).json({ error: 'Only admins or workers can create orders' });
        }

        const { platform, eldorado_ref, client_username, client_password, client_email, order_type, order_link, assigned_worker_id, aldorado_account, accepted_price, notes } = req.body;

        if (!client_username || !accepted_price) {
            return res.status(400).json({ error: 'Client username and Accepted price are required' });
        }

        try {
            const id = await generateOrderId();
            await db.run(
                `INSERT INTO local_orders (id, platform, eldorado_ref, client_username, client_password, client_email, order_type, order_link, assigned_worker_id, aldorado_account, accepted_price, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, platform, eldorado_ref, client_username, client_password, client_email, order_type || 'Leveling', order_link, assigned_worker_id, aldorado_account, accepted_price, notes]
            );

            await db.run(
                'INSERT INTO order_history (order_id, status_to, changed_by) VALUES (?, ?, ?)',
                [id, 'New', req.user.id]
            );

            res.status(201).json({ id });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // MULTER SETUP
    const multer = require('multer');
    const path = require('path');
    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, 'uploads/'),
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        }
    });
    const upload = multer({ storage: storage });

    // COMPLETE Order with Screenshot
    router.post('/:id/complete', auth, upload.single('screenshot'), async (req, res) => {
        const { id } = req.params;
        const file = req.file;

        if (!file) return res.status(400).json({ error: 'Screenshot is required' });

        try {
            const existing = await db.get('SELECT * FROM local_orders WHERE id = ?', [id]);
            if (!existing) return res.status(404).json({ error: 'Order not found' });

            // Only assigned worker or admin
            if (req.user.role === 'worker' && existing.assigned_worker_id !== req.user.id) {
                return res.status(403).json({ error: 'Not authorized' });
            }

            // Update DB
            await db.run(
                `UPDATE local_orders 
                 SET status = 'Completed', 
                     completed_at = CURRENT_TIMESTAMP, 
                     screenshot_path = ? 
                 WHERE id = ?`,
                [file.filename, id]
            );

            // History
            await db.run(
                'INSERT INTO order_history (order_id, status_from, status_to, changed_by) VALUES (?, ?, ?, ?)',
                [id, existing.status, 'Completed', req.user.id]
            );

            res.json({ success: true, screenshot_path: file.filename });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // UPDATE local order (Legacy/Standard update)
    router.put('/:id', auth, async (req, res) => {
        const { id } = req.params;
        const updates = req.body;

        try {
            const existing = await db.get('SELECT * FROM local_orders WHERE id = ?', [id]);
            if (!existing) return res.status(404).json({ error: 'Order not found' });

            // Permission check
            if (req.user.role === 'worker' && existing.assigned_worker_id !== req.user.id) {
                return res.status(403).json({ error: 'Not authorized' });
            }

            // Fields to update
            let query = 'UPDATE local_orders SET ';
            const params = [];
            const fields = [];

            // Status change logic
            if (updates.status && updates.status !== existing.status) {
                fields.push('status = ?');
                params.push(updates.status);

                if (updates.status === 'Completed') {
                    fields.push('completed_at = CURRENT_TIMESTAMP');
                }

                await db.run(
                    'INSERT INTO order_history (order_id, status_from, status_to, changed_by) VALUES (?, ?, ?, ?)',
                    [id, existing.status, updates.status, req.user.id]
                );
            }

            // Worker specific restrictions
            if (req.user.role === 'admin') {
                ['platform', 'eldorado_ref', 'client_username', 'client_password', 'client_email', 'order_type', 'order_link', 'assigned_worker_id', 'aldorado_account', 'accepted_price', 'notes'].forEach(field => {
                    if (updates[field] !== undefined) {
                        fields.push(`${field} = ?`);
                        params.push(updates[field]);
                    }
                });
            } else {
                // Workers can only update status and maybe notes
                if (updates.notes !== undefined) {
                    fields.push('notes = ?');
                    params.push(updates.notes);
                }
            }

            if (fields.length === 0) return res.json({ message: 'No changes' });

            query += fields.join(', ') + ' WHERE id = ?';
            params.push(id);

            await db.run(query, params);
            res.json({ message: 'Order updated' });
        } catch (err) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Eldorado: Import Accepted Orders
    router.post('/eldorado/import', auth, async (req, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

        const { orders } = req.body; // Array of objects
        if (!Array.isArray(orders)) return res.status(400).json({ error: 'Invalid data' });

        try {
            const stmt = await db.prepare(
                'INSERT OR REPLACE INTO eldorado_orders (eldorado_id, buyer_username, accepted_price, order_link, state) VALUES (?, ?, ?, ?, ?)'
            );
            for (const order of orders) {
                await stmt.run([order.eldorado_id, order.buyer_username, order.accepted_price, order.order_link, order.state || 'Pending Delivery']);
            }
            await stmt.finalize();
            res.json({ message: 'Orders imported successfully' });
        } catch (err) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Eldorado: Get Accepted Orders
    router.get('/eldorado', auth, async (req, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
        try {
            const orders = await db.all('SELECT * FROM eldorado_orders WHERE converted_to_local_id IS NULL');
            res.json(orders);
        } catch (err) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Eldorado: Convert to Local Order
    router.post('/eldorado/convert/:eldoradoId', auth, async (req, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

        const { eldoradoId } = req.params;
        const { assigned_worker_id } = req.body;

        try {
            const eldo = await db.get('SELECT * FROM eldorado_orders WHERE eldorado_id = ?', [eldoradoId]);
            if (!eldo) return res.status(404).json({ error: 'Eldorado order not found' });
            if (eldo.converted_to_local_id) return res.status(400).json({ error: 'Order already converted' });

            const localId = await generateOrderId();
            await db.run(
                `INSERT INTO local_orders (id, platform, eldorado_ref, client_username, order_link, assigned_worker_id, accepted_price, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [localId, 'Eldorado', eldoradoId, eldo.buyer_username, eldo.order_link, assigned_worker_id, eldo.accepted_price, 'New']
            );

            await db.run(
                'UPDATE eldorado_orders SET converted_to_local_id = ? WHERE eldorado_id = ?',
                [localId, eldoradoId]
            );

            await db.run(
                'INSERT INTO order_history (order_id, status_to, changed_by) VALUES (?, ?, ?)',
                [localId, 'New', req.user.id]
            );

            res.json({ success: true, localId });
        } catch (err) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    // GET History
    router.get('/:id/history', auth, async (req, res) => {
        try {
            const history = await db.all(
                `SELECT h.*, u.username as changed_by_name 
         FROM order_history h 
         LEFT JOIN users u ON h.changed_by = u.id 
         WHERE h.order_id = ? ORDER BY h.timestamp DESC`,
                [req.params.id]
            );
            res.json(history);
        } catch (err) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    return router;
};
