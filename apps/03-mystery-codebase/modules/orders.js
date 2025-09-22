const express = require('express');
const db = require('../database');
const { authenticate } = require('./auth');
const payments = require('./payments');
const inventory = require('./inventory');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
    let orders;
    
    if (req.user.role === 'admin') {
        orders = db.orders;
    } else {
        orders = db.orders.filter(o => o.userId === req.user.id);
    }
    
    const { status, startDate, endDate } = req.query;
    
    if (status) {
        orders = orders.filter(o => o.status === status);
    }
    
    if (startDate) {
        orders = orders.filter(o => new Date(o.createdAt) >= new Date(startDate));
    }
    
    if (endDate) {
        orders = orders.filter(o => new Date(o.createdAt) <= new Date(endDate));
    }
    
    res.json(orders);
});

router.get('/:id', authenticate, (req, res) => {
    const order = db.orders.find(o => o.id === req.params.id);
    
    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }
    
    if (req.user.role !== 'admin' && order.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const orderWithDetails = {
        ...order,
        items: order.items.map(item => {
            const product = db.products.find(p => p.id === item.productId);
            return {
                ...item,
                product
            };
        })
    };
    
    res.json(orderWithDetails);
});

router.post('/', authenticate, (req, res) => {
    const { items, shippingAddress, paymentMethod } = req.body;
    
    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'No items in order' });
    }
    
    let total = 0;
    const orderItems = [];
    const unavailableItems = [];
    
    for (const item of items) {
        const product = db.products.find(p => p.id === item.productId);
        if (!product) {
            unavailableItems.push(item.productId);
            continue;
        }
        
        const inventoryItem = db.inventory.find(i => i.productId === item.productId);
        const available = inventoryItem ? inventoryItem.quantity - inventoryItem.reserved : 0;
        
        if (available < item.quantity) {
            unavailableItems.push({
                productId: item.productId,
                requested: item.quantity,
                available
            });
            continue;
        }
        
        const itemTotal = product.price * item.quantity;
        total += itemTotal;
        
        orderItems.push({
            productId: item.productId,
            quantity: item.quantity,
            price: product.price,
            subtotal: itemTotal
        });
        
        if (inventoryItem) {
            inventoryItem.reserved += item.quantity;
        }
    }
    
    if (unavailableItems.length > 0) {
        return res.status(400).json({ 
            error: 'Some items are not available',
            unavailableItems 
        });
    }
    
    const user = db.users.find(u => u.id === req.user.id);
    
    if (paymentMethod === 'balance' && user.balance < total) {
        return res.status(400).json({ 
            error: 'Insufficient balance',
            required: total,
            available: user.balance
        });
    }
    
    const order = {
        id: 'ord' + db.generateId(),
        userId: req.user.id,
        items: orderItems,
        total,
        status: 'pending',
        shippingAddress,
        paymentMethod,
        createdAt: new Date().toISOString()
    };
    
    db.orders.push(order);
    
    if (paymentMethod === 'balance') {
        user.balance -= total;
        order.status = 'paid';
        
        const payment = {
            id: 'pay' + db.generateId(),
            orderId: order.id,
            amount: total,
            method: 'balance',
            status: 'completed',
            transactionId: 'bal_' + db.generateId(),
            createdAt: new Date().toISOString()
        };
        
        db.payments.push(payment);
    }
    
    res.status(201).json(order);
});

router.put('/:id/status', authenticate, (req, res) => {
    const { status } = req.body;
    
    const order = db.orders.find(o => o.id === req.params.id);
    
    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }
    
    if (req.user.role !== 'admin' && order.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const validStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    
    const oldStatus = order.status;
    order.status = status;
    order.updatedAt = new Date().toISOString();
    
    if (status === 'cancelled' && oldStatus !== 'cancelled') {
        for (const item of order.items) {
            const inventoryItem = db.inventory.find(i => i.productId === item.productId);
            if (inventoryItem) {
                inventoryItem.reserved -= item.quantity;
            }
        }
        
        if (order.paymentMethod === 'balance') {
            const user = db.users.find(u => u.id === order.userId);
            if (user) {
                user.balance += order.total;
            }
        }
    }
    
    if (status === 'delivered') {
        for (const item of order.items) {
            const inventoryItem = db.inventory.find(i => i.productId === item.productId);
            if (inventoryItem) {
                inventoryItem.quantity -= item.quantity;
                inventoryItem.reserved -= item.quantity;
            }
        }
    }
    
    res.json(order);
});

router.delete('/:id', authenticate, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    const orderIndex = db.orders.findIndex(o => o.id === req.params.id);
    
    if (orderIndex === -1) {
        return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = db.orders[orderIndex];
    
    if (order.status !== 'cancelled') {
        for (const item of order.items) {
            const inventoryItem = db.inventory.find(i => i.productId === item.productId);
            if (inventoryItem) {
                inventoryItem.reserved -= item.quantity;
            }
        }
    }
    
    db.orders.splice(orderIndex, 1);
    
    res.json({ message: 'Order deleted', order });
});

router.get('/:id/tracking', authenticate, (req, res) => {
    const order = db.orders.find(o => o.id === req.params.id);
    
    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }
    
    if (req.user.role !== 'admin' && order.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const tracking = {
        orderId: order.id,
        status: order.status,
        trackingNumber: 'TRK' + order.id.toUpperCase(),
        carrier: 'FastShip Express',
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        events: [
            {
                status: 'Order placed',
                timestamp: order.createdAt,
                location: 'Online'
            }
        ]
    };
    
    if (order.status !== 'pending') {
        tracking.events.push({
            status: 'Payment confirmed',
            timestamp: new Date(new Date(order.createdAt).getTime() + 3600000).toISOString(),
            location: 'Payment Gateway'
        });
    }
    
    if (['processing', 'shipped', 'delivered'].includes(order.status)) {
        tracking.events.push({
            status: 'Processing',
            timestamp: new Date(new Date(order.createdAt).getTime() + 7200000).toISOString(),
            location: 'Warehouse'
        });
    }
    
    if (['shipped', 'delivered'].includes(order.status)) {
        tracking.events.push({
            status: 'Shipped',
            timestamp: new Date(new Date(order.createdAt).getTime() + 86400000).toISOString(),
            location: 'Distribution Center'
        });
    }
    
    if (order.status === 'delivered') {
        tracking.events.push({
            status: 'Delivered',
            timestamp: new Date(new Date(order.createdAt).getTime() + 259200000).toISOString(),
            location: order.shippingAddress
        });
    }
    
    res.json(tracking);
});

module.exports = router;
