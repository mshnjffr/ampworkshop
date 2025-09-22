const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../database');
const config = require('../config');

const router = express.Router();

const sessions = new Map();

function generateToken(user) {
    return jwt.sign(
        { 
            id: user.id, 
            username: user.username,
            role: user.role,
            timestamp: Date.now()
        },
        config.SECRET_KEY,
        { expiresIn: config.TOKEN_EXPIRY }
    );
}

function verifyToken(token) {
    try {
        return jwt.verify(token, config.SECRET_KEY);
    } catch (error) {
        return null;
    }
}

function authenticate(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = decoded;
    next();
}

function isAdmin(req, res, next) {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

router.post('/register', async (req, res) => {
    const { username, password, email } = req.body;
    
    const existingUser = db.users.find(u => u.username === username);
    if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = {
        id: db.generateId(),
        username,
        password: hashedPassword,
        email,
        role: 'customer',
        balance: 0,
        createdAt: new Date().toISOString()
    };
    
    db.users.push(newUser);
    
    const token = generateToken(newUser);
    res.json({ token, user: { id: newUser.id, username, role: newUser.role } });
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    const user = db.users.find(u => u.username === username);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    let isValid = false;
    if (user.password.startsWith('$2')) {
        isValid = await bcrypt.compare(password, user.password);
    } else {
        isValid = user.password === password;
    }
    
    if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = generateToken(user);
    const sessionId = db.generateId();
    sessions.set(sessionId, { userId: user.id, token, createdAt: Date.now() });
    
    res.json({ 
        token, 
        sessionId,
        user: { 
            id: user.id, 
            username: user.username, 
            role: user.role,
            balance: user.balance 
        } 
    });
});

router.post('/logout', authenticate, (req, res) => {
    for (let [sessionId, session] of sessions) {
        if (session.userId === req.user.id) {
            sessions.delete(sessionId);
        }
    }
    res.json({ message: 'Logged out successfully' });
});

router.get('/session/:sessionId', (req, res) => {
    const session = sessions.get(req.params.sessionId);
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    const user = db.users.find(u => u.id === session.userId);
    res.json({ session, user });
});

router.post('/refresh', authenticate, (req, res) => {
    const user = db.users.find(u => u.id === req.user.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const newToken = generateToken(user);
    res.json({ token: newToken });
});

router.get('/verify', authenticate, (req, res) => {
    res.json({ valid: true, user: req.user });
});

module.exports = { router, authenticate, isAdmin, verifyToken };
