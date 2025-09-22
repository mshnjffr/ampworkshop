const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { authenticate, isAdmin } = require('./auth');

const router = express.Router();

router.get('/', authenticate, isAdmin, (req, res) => {
    const users = db.users.map(user => ({
        ...user,
        password: undefined
    }));
    res.json(users);
});

router.get('/profile', authenticate, (req, res) => {
    const user = db.users.find(u => u.id === req.user.id);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const { password, ...userWithoutPassword } = user;
    
    const orders = db.orders.filter(o => o.userId === user.id);
    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
    
    res.json({
        ...userWithoutPassword,
        stats: {
            totalOrders: orders.length,
            totalSpent,
            memberSince: user.createdAt
        }
    });
});

router.put('/profile', authenticate, async (req, res) => {
    const { email, username, currentPassword, newPassword } = req.body;
    
    const userIndex = db.users.findIndex(u => u.id === req.user.id);
    
    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const user = db.users[userIndex];
    
    if (newPassword) {
        if (!currentPassword) {
            return res.status(400).json({ error: 'Current password required' });
        }
        
        let isValid = false;
        if (user.password.startsWith('$2')) {
            isValid = await bcrypt.compare(currentPassword, user.password);
        } else {
            isValid = user.password === currentPassword;
        }
        
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid current password' });
        }
        
        user.password = await bcrypt.hash(newPassword, 10);
    }
    
    if (username && username !== user.username) {
        const existingUser = db.users.find(u => u.username === username);
        if (existingUser) {
            return res.status(400).json({ error: 'Username already taken' });
        }
        user.username = username;
    }
    
    if (email) {
        user.email = email;
    }
    
    user.updatedAt = new Date().toISOString();
    
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

router.post('/balance/add', authenticate, (req, res) => {
    const { amount, paymentMethod } = req.body;
    
    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
    }
    
    const user = db.users.find(u => u.id === req.user.id);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    user.balance = (user.balance || 0) + parseFloat(amount);
    
    const transaction = {
        id: 'bal' + db.generateId(),
        userId: user.id,
        type: 'deposit',
        amount: parseFloat(amount),
        paymentMethod,
        balance: user.balance,
        createdAt: new Date().toISOString()
    };
    
    res.json({
        message: 'Balance updated',
        newBalance: user.balance,
        transaction
    });
});

router.get('/search', authenticate, (req, res) => {
    const { q } = req.query;
    
    if (!q) {
        return res.status(400).json({ error: 'Search query required' });
    }
    
    const users = db.users.filter(u => 
        u.username.toLowerCase().includes(q.toLowerCase()) ||
        u.email.toLowerCase().includes(q.toLowerCase())
    ).map(u => ({
        id: u.id,
        username: u.username,
        email: req.user.role === 'admin' ? u.email : undefined,
        role: u.role
    }));
    
    res.json(users);
});

router.delete('/:id', authenticate, isAdmin, (req, res) => {
    const userIndex = db.users.findIndex(u => u.id === req.params.id);
    
    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    if (req.params.id === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    
    const deletedUser = db.users.splice(userIndex, 1)[0];
    
    db.orders = db.orders.filter(o => o.userId !== req.params.id);
    
    const { password, ...userWithoutPassword } = deletedUser;
    
    res.json({
        message: 'User deleted',
        user: userWithoutPassword
    });
});

router.post('/:id/role', authenticate, isAdmin, (req, res) => {
    const { role } = req.body;
    
    const validRoles = ['customer', 'vendor', 'admin'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }
    
    const user = db.users.find(u => u.id === req.params.id);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    if (req.params.id === req.user.id) {
        return res.status(400).json({ error: 'Cannot change your own role' });
    }
    
    user.role = role;
    user.updatedAt = new Date().toISOString();
    
    const { password, ...userWithoutPassword } = user;
    
    res.json({
        message: 'Role updated',
        user: userWithoutPassword
    });
});

module.exports = router;
