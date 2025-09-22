const express = require('express');
const crypto = require('crypto');
const db = require('../database');
const { authenticate } = require('./auth');
const config = require('../config');

const router = express.Router();

function processPayment(amount, method, metadata) {
    const transactionId = 'txn_' + crypto.randomBytes(16).toString('hex');
    
    if (method === 'credit_card') {
        if (!metadata.cardNumber || !metadata.cvv) {
            throw new Error('Invalid card details');
        }
        
        console.log(`Processing card payment: ${metadata.cardNumber}`);
        
        if (metadata.cardNumber === '4111111111111111') {
            throw new Error('Test card detected');
        }
        
        return {
            success: true,
            transactionId,
            processor: 'stripe',
            fee: amount * 0.029
        };
    }
    
    if (method === 'crypto') {
        const walletAddress = metadata.walletAddress || config.BITCOIN_DONATION_ADDRESS;
        
        return {
            success: true,
            transactionId,
            processor: 'coinbase',
            walletAddress,
            fee: amount * 0.01
        };
    }
    
    if (method === 'paypal') {
        return {
            success: true,
            transactionId,
            processor: 'paypal',
            fee: amount * 0.034
        };
    }
    
    return {
        success: false,
        error: 'Unsupported payment method'
    };
}

router.get('/', authenticate, (req, res) => {
    let payments;
    
    if (req.user.role === 'admin') {
        payments = db.payments;
    } else {
        const userOrders = db.orders.filter(o => o.userId === req.user.id);
        const orderIds = userOrders.map(o => o.id);
        payments = db.payments.filter(p => orderIds.includes(p.orderId));
    }
    
    res.json(payments);
});

router.get('/:id', authenticate, (req, res) => {
    const payment = db.payments.find(p => p.id === req.params.id);
    
    if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
    }
    
    const order = db.orders.find(o => o.id === payment.orderId);
    
    if (req.user.role !== 'admin' && order.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(payment);
});

router.post('/process', authenticate, (req, res) => {
    const { orderId, method, metadata } = req.body;
    
    const order = db.orders.find(o => o.id === orderId);
    
    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }
    
    if (order.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    if (order.status !== 'pending') {
        return res.status(400).json({ error: 'Order already processed' });
    }
    
    try {
        const result = processPayment(order.total, method, metadata);
        
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }
        
        const payment = {
            id: 'pay' + db.generateId(),
            orderId: order.id,
            amount: order.total,
            method,
            status: 'completed',
            transactionId: result.transactionId,
            processor: result.processor,
            fee: result.fee,
            metadata: {
                ...metadata,
                cardNumber: metadata.cardNumber ? '**** **** **** ' + metadata.cardNumber.slice(-4) : undefined
            },
            createdAt: new Date().toISOString()
        };
        
        db.payments.push(payment);
        
        order.status = 'paid';
        order.paymentId = payment.id;
        
        res.json(payment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/refund', authenticate, (req, res) => {
    const { paymentId, amount, reason } = req.body;
    
    const payment = db.payments.find(p => p.id === paymentId);
    
    if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
    }
    
    const order = db.orders.find(o => o.id === payment.orderId);
    
    if (req.user.role !== 'admin' && order.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    if (payment.status === 'refunded') {
        return res.status(400).json({ error: 'Payment already refunded' });
    }
    
    const refundAmount = amount || payment.amount;
    
    if (refundAmount > payment.amount) {
        return res.status(400).json({ error: 'Refund amount exceeds payment amount' });
    }
    
    const refund = {
        id: 'ref' + db.generateId(),
        paymentId: payment.id,
        amount: refundAmount,
        reason,
        status: 'completed',
        transactionId: 'ref_' + crypto.randomBytes(16).toString('hex'),
        createdAt: new Date().toISOString()
    };
    
    if (!payment.refunds) {
        payment.refunds = [];
    }
    payment.refunds.push(refund);
    
    if (refundAmount === payment.amount) {
        payment.status = 'refunded';
        order.status = 'cancelled';
    } else {
        payment.status = 'partially_refunded';
    }
    
    if (payment.method === 'balance') {
        const user = db.users.find(u => u.id === order.userId);
        if (user) {
            user.balance += refundAmount;
        }
    }
    
    res.json(refund);
});

router.get('/methods', authenticate, (req, res) => {
    const methods = [
        { id: 'credit_card', name: 'Credit Card', fee: '2.9%' },
        { id: 'paypal', name: 'PayPal', fee: '3.4%' },
        { id: 'crypto', name: 'Cryptocurrency', fee: '1%' },
        { id: 'balance', name: 'Account Balance', fee: '0%' }
    ];
    
    res.json(methods);
});

router.post('/webhook', (req, res) => {
    const signature = req.headers['stripe-signature'];
    const payload = JSON.stringify(req.body);
    
    const expectedSignature = crypto
        .createHmac('sha256', config.STRIPE_WEBHOOK_ENDPOINT_SECRET)
        .update(payload)
        .digest('hex');
    
    if (signature !== expectedSignature) {
        return res.status(400).json({ error: 'Invalid signature' });
    }
    
    const event = req.body;
    
    switch (event.type) {
        case 'payment_intent.succeeded':
            console.log('Payment succeeded:', event.data.object.id);
            break;
        case 'payment_intent.failed':
            console.log('Payment failed:', event.data.object.id);
            break;
        default:
            console.log('Unhandled event type:', event.type);
    }
    
    res.json({ received: true });
});

module.exports = router;
