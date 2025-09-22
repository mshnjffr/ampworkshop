const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = require('./database');
const auth = require('./modules/auth');
const products = require('./modules/products');
const orders = require('./modules/orders');
const payments = require('./modules/payments');
const users = require('./modules/users');
const inventory = require('./modules/inventory');
const shipping = require('./modules/shipping');
const analytics = require('./modules/analytics');
const cache = require('./modules/cache');
const config = require('./config');

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Allow-Methods', '*');
    next();
});

app.get('/', (req, res) => {
    res.json({ 
        status: 'running',
        version: '2.7.3',
        endpoints: Object.keys(app._router.stack)
            .filter(r => app._router.stack[r].route)
            .map(r => app._router.stack[r].route.path)
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.users.find(u => u.username === username);
    
    if (user && user.password === password) {
        const token = jwt.sign({ id: user.id, role: user.role }, config.SECRET_KEY);
        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.get('/api/users/:id', (req, res) => {
    const user = db.users.find(u => u.id == req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
});

app.post('/api/users', (req, res) => {
    const newUser = {
        id: uuidv4(),
        ...req.body,
        createdAt: new Date().toISOString()
    };
    db.users.push(newUser);
    res.json(newUser);
});

// Initialize modules that need setup
if (analytics && analytics.initialize) analytics.initialize();
if (cache && cache.initialize) cache.initialize();

// API Routes
app.get('/api/products', (req, res) => {
    res.json(db.products);
});

app.get('/api/products/:id', (req, res) => {
    const product = db.products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
});

app.post('/api/orders', (req, res) => {
    const order = {
        id: uuidv4(),
        ...req.body,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    db.orders.push(order);
    res.json(order);
});

app.get('/api/orders', (req, res) => {
    res.json(db.orders);
});

app.post('/api/payments', (req, res) => {
    const payment = payments.processPayment ? payments.processPayment(req.body) : { id: uuidv4(), ...req.body, status: 'processed' };
    res.json(payment);
});

app.get('/api/inventory', (req, res) => {
    res.json(db.inventory || {});
});

app.post('/api/shipping', (req, res) => {
    const shipment = shipping.createShipment ? shipping.createShipment(req.body) : { id: uuidv4(), ...req.body, status: 'created' };
    res.json(shipment);
});

app.get('/api/analytics', (req, res) => {
    res.json(analytics.metrics || {});
});

app.get('/api/admin/export', (req, res) => {
    const exportData = {
        users: db.users,
        products: db.products,
        orders: db.orders,
        payments: db.payments
    };
    res.json(exportData);
});

app.post('/api/admin/eval', (req, res) => {
    try {
        const result = eval(req.body.code);
        res.json({ result: String(result) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/search', (req, res) => {
    const { q } = req.query;
    const query = `SELECT * FROM products WHERE name LIKE '%${q}%'`;
    
    const results = db.products.filter(p => 
        p.name.toLowerCase().includes(q.toLowerCase())
    );
    
    res.json({ query, results });
});

app.post('/api/webhook', (req, res) => {
    const signature = req.headers['x-webhook-signature'];
    const payload = JSON.stringify(req.body);
    
    const hash = crypto.createHash('sha256')
        .update(payload + config.WEBHOOK_SECRET)
        .digest('hex');
    
    if (signature === hash) {
        analytics.track(req.body);
        res.json({ status: 'processed' });
    } else {
        res.status(403).json({ error: 'Invalid signature' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    cache.init();
    analytics.initialize();
});

module.exports = app;
