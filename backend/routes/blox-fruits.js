const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

module.exports = (db) => {
    // GET all fruits
    router.get('/', auth, async (req, res) => {
        try {
            const fruits = await db.all('SELECT * FROM blox_fruits ORDER BY name ASC');
            res.json(fruits);
        } catch (err) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    // ADD or UPDATE fruit stock (Admin only)
    router.post('/', auth, async (req, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
        const { id, name, image_url, quantity, rarity, price } = req.body;

        try {
            if (id) {
                // Update
                await db.run(
                    'UPDATE blox_fruits SET name = ?, image_url = ?, quantity = ?, rarity = ?, price = ? WHERE id = ?',
                    [name, image_url, quantity, rarity, price, id]
                );
                res.json({ message: 'Fruit updated' });
            } else {
                // Insert
                await db.run(
                    'INSERT INTO blox_fruits (name, image_url, quantity, rarity, price) VALUES (?, ?, ?, ?, ?)',
                    [name, image_url, quantity, rarity, price]
                );
                res.status(201).json({ message: 'Fruit added' });
            }
        } catch (err) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Discord Webhook Endpoint
    // Expects: { "content": "Found fruit: Leopard" } or similar
    router.post('/webhook', async (req, res) => {
        const { content } = req.body;
        if (!content) return res.status(400).json({ error: 'Invalid payload' });

        // Simple regex to find fruit name after "Found fruit:"
        const match = content.match(/Found fruit:\s*([\w\s]+)/i);
        if (match) {
            const fruitName = match[1].trim();
            try {
                const fruit = await db.get('SELECT * FROM blox_fruits WHERE name LIKE ?', [`%${fruitName}%`]);
                if (fruit) {
                    await db.run('UPDATE blox_fruits SET quantity = quantity + 1 WHERE id = ?', [fruit.id]);
                    await db.run('INSERT INTO fruit_stock_history (fruit_id, change_amount, reason) VALUES (?, ?, ?)', [fruit.id, 1, 'Discord Webhook']);
                    return res.json({ success: true, message: `Stock updated for ${fruit.name}` });
                } else {
                    return res.status(404).json({ error: `Fruit ${fruitName} not found in database` });
                }
            } catch (err) {
                return res.status(500).json({ error: 'Server error' });
            }
        }
        res.status(400).json({ error: 'No fruit name found in content' });
    });

    // Create Fruit Order
    router.post('/order', auth, async (req, res) => {
        const { local_order_id, fruit_id, quantity } = req.body;
        if (!local_order_id || !fruit_id || !quantity) return res.status(400).json({ error: 'Missing data' });

        try {
            const fruit = await db.get('SELECT * FROM blox_fruits WHERE id = ?', [fruit_id]);
            if (!fruit || fruit.quantity < quantity) {
                return res.status(400).json({ error: 'Insufficient stock or fruit not found' });
            }

            await db.run(
                'INSERT INTO fruit_orders (local_order_id, fruit_id, quantity) VALUES (?, ?, ?)',
                [local_order_id, fruit_id, quantity]
            );

            await db.run('UPDATE blox_fruits SET quantity = quantity - ? WHERE id = ?', [quantity, fruit_id]);
            await db.run('INSERT INTO fruit_stock_history (fruit_id, change_amount, reason) VALUES (?, ?, ?)', [fruit_id, -quantity, `Order ${local_order_id}`]);

            res.status(201).json({ message: 'Fruit order created successfully' });
        } catch (err) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    // UPDATE Fruit Stock (PATCH)
    router.patch('/:id/stock', auth, async (req, res) => {
        const { id } = req.params;
        const { quantity, mode } = req.body;

        try {
            const fruit = await db.get('SELECT * FROM blox_fruits WHERE id = ?', [id]);
            if (!fruit) return res.status(404).json({ error: 'Fruit not found' });

            let newQuantity = fruit.quantity;
            let changeAmount = 0;

            if (mode === 'set') {
                changeAmount = quantity - fruit.quantity;
                newQuantity = quantity;
            } else if (mode === 'increment') {
                changeAmount = 1;
                newQuantity = fruit.quantity + 1;
            } else if (mode === 'decrement') {
                changeAmount = -1;
                newQuantity = Math.max(0, fruit.quantity - 1);
            }

            if (changeAmount !== 0) {
                await db.run('UPDATE blox_fruits SET quantity = ? WHERE id = ?', [newQuantity, id]);
                await db.run('INSERT INTO fruit_stock_history (fruit_id, change_amount, reason) VALUES (?, ?, ?)',
                    [id, changeAmount, `Manual Update (${req.user.username})`]);
            }

            res.json({ success: true, newQuantity });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    return router;
};
