require('dotenv').config();
const express = require('express');
const cors = require('cors');
const setupDb = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

let db;

async function startServer() {
    db = await setupDb();

    // Dependency injection for routes
    const authRoutes = require('./routes/auth')(db);
    const orderRoutes = require('./routes/orders')(db);
    const userRoutes = require('./routes/users')(db);
    const bloxFruitsRoutes = require('./routes/blox-fruits')(db);
    const analyticsRoutes = require('./routes/analytics')(db);
    const expenseRoutes = require('./routes/expenses')(db);
    const campaignRoutes = require('./routes/campaigns')(db);
    const accountRoutes = require('./routes/accounts')(db);
    const scriptsRoutes = require('./routes/scripts')(db);

    const path = require('path');

    app.use('/api/auth', authRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/analytics', analyticsRoutes);
    app.use('/api/blox-fruits', bloxFruitsRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/campaigns', campaignRoutes);
    app.use('/api/expenses', expenseRoutes);
    app.use('/api/accounts', accountRoutes);
    app.use('/api/scripts', scriptsRoutes);

    // Serve static files from React app
    app.use(express.static(path.join(__dirname, '../frontend/dist')));

    // Handle React routing, return all requests to React app
    app.get(/(.*)/, (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startServer().catch(err => {
    console.error('Failed to start server:', err);
});
