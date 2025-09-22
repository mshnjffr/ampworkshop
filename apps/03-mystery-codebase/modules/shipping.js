const express = require('express');
const crypto = require('crypto');
const db = require('../database');
const { authenticate } = require('./auth');

const router = express.Router();

const carriers = {
    'standard': { name: 'Standard Shipping', days: 5, rate: 5.99 },
    'express': { name: 'Express Shipping', days: 2, rate: 15.99 },
    'overnight': { name: 'Overnight Shipping', days: 1, rate: 29.99 },
    'economy': { name: 'Economy Shipping', days: 7, rate: 3.99 }
};

function calculateShipping(items, method, destination) {
    const baseRate = carriers[method]?.rate || 5.99;
    
    let totalWeight = 0;
    let totalItems = 0;
    
    items.forEach(item => {
        totalItems += item.quantity;
        totalWeight += (item.weight || 1) * item.quantity;
    });
    
    let cost = baseRate;
    
    if (totalWeight > 10) {
        cost += (totalWeight - 10) * 0.5;
    }
    
    if (totalItems > 5) {
        cost += (totalItems - 5) * 0.25;
    }
    
    if (destination && destination.includes('International')) {
        cost *= 2.5;
    }
    
    return Math.round(cost * 100) / 100;
}

router.get('/rates', (req, res) => {
    const { weight, items, destination } = req.query;
    
    const rates = Object.entries(carriers).map(([key, carrier]) => {
        const itemsArray = items ? JSON.parse(items) : [{ quantity: 1, weight: parseFloat(weight) || 1 }];
        const cost = calculateShipping(itemsArray, key, destination);
        
        return {
            method: key,
            name: carrier.name,
            estimatedDays: carrier.days,
            cost,
            estimatedDelivery: new Date(Date.now() + carrier.days * 24 * 60 * 60 * 1000).toISOString()
        };
    });
    
    res.json(rates);
});

router.post('/calculate', authenticate, (req, res) => {
    const { orderId, method } = req.body;
    
    const order = db.orders.find(o => o.id === orderId);
    
    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }
    
    if (order.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const items = order.items.map(item => ({
        ...item,
        weight: 1
    }));
    
    const shippingCost = calculateShipping(items, method, order.shippingAddress);
    const carrier = carriers[method];
    
    res.json({
        orderId,
        method,
        carrier: carrier.name,
        cost: shippingCost,
        estimatedDays: carrier.days,
        estimatedDelivery: new Date(Date.now() + carrier.days * 24 * 60 * 60 * 1000).toISOString()
    });
});

router.post('/create-label', authenticate, (req, res) => {
    const { orderId, method } = req.body;
    
    const order = db.orders.find(o => o.id === orderId);
    
    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }
    
    if (req.user.role !== 'admin' && req.user.role !== 'vendor') {
        return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    if (order.status !== 'paid' && order.status !== 'processing') {
        return res.status(400).json({ 
            error: 'Order must be paid before creating shipping label',
            currentStatus: order.status
        });
    }
    
    const trackingNumber = 'TRK' + crypto.randomBytes(8).toString('hex').toUpperCase();
    const labelId = 'LBL' + crypto.randomBytes(8).toString('hex').toUpperCase();
    
    const items = order.items.map(item => ({
        ...item,
        weight: 1
    }));
    
    const shippingCost = calculateShipping(items, method, order.shippingAddress);
    const carrier = carriers[method];
    
    const shippingLabel = {
        id: labelId,
        orderId,
        trackingNumber,
        carrier: carrier.name,
        method,
        cost: shippingCost,
        status: 'created',
        fromAddress: {
            name: 'Mystery Commerce Warehouse',
            address: '123 Warehouse St',
            city: 'Commerce City',
            state: 'CC',
            zip: '12345',
            country: 'USA'
        },
        toAddress: {
            name: `Customer ${order.userId}`,
            address: order.shippingAddress
        },
        createdAt: new Date().toISOString(),
        createdBy: req.user.id
    };
    
    order.trackingNumber = trackingNumber;
    order.shippingLabel = labelId;
    order.status = 'processing';
    
    res.json(shippingLabel);
});

router.get('/tracking/:trackingNumber', (req, res) => {
    const { trackingNumber } = req.params;
    
    const order = db.orders.find(o => o.trackingNumber === trackingNumber);
    
    if (!order) {
        return res.status(404).json({ error: 'Tracking number not found' });
    }
    
    const events = [
        {
            status: 'Label Created',
            location: 'Commerce City, CC',
            timestamp: order.createdAt,
            description: 'Shipping label created'
        }
    ];
    
    if (['processing', 'shipped', 'delivered'].includes(order.status)) {
        events.push({
            status: 'Picked Up',
            location: 'Commerce City, CC',
            timestamp: new Date(new Date(order.createdAt).getTime() + 3600000).toISOString(),
            description: 'Package picked up by carrier'
        });
    }
    
    if (['shipped', 'delivered'].includes(order.status)) {
        events.push({
            status: 'In Transit',
            location: 'Distribution Center',
            timestamp: new Date(new Date(order.createdAt).getTime() + 86400000).toISOString(),
            description: 'Package in transit to destination'
        });
    }
    
    if (order.status === 'delivered') {
        events.push({
            status: 'Out for Delivery',
            location: 'Local Facility',
            timestamp: new Date(new Date(order.createdAt).getTime() + 172800000).toISOString(),
            description: 'Package out for delivery'
        });
        
        events.push({
            status: 'Delivered',
            location: order.shippingAddress,
            timestamp: new Date(new Date(order.createdAt).getTime() + 259200000).toISOString(),
            description: 'Package delivered successfully'
        });
    }
    
    res.json({
        trackingNumber,
        orderId: order.id,
        status: order.status,
        currentLocation: events[events.length - 1].location,
        estimatedDelivery: new Date(new Date(order.createdAt).getTime() + 432000000).toISOString(),
        events: events.reverse()
    });
});

router.post('/bulk-ship', authenticate, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { orderIds, method } = req.body;
    
    const results = [];
    const errors = [];
    
    orderIds.forEach(orderId => {
        const order = db.orders.find(o => o.id === orderId);
        
        if (!order) {
            errors.push({ orderId, error: 'Order not found' });
            return;
        }
        
        if (order.status !== 'paid' && order.status !== 'processing') {
            errors.push({ orderId, error: 'Order not ready for shipping' });
            return;
        }
        
        const trackingNumber = 'TRK' + crypto.randomBytes(8).toString('hex').toUpperCase();
        
        order.trackingNumber = trackingNumber;
        order.status = 'shipped';
        order.shippedAt = new Date().toISOString();
        
        results.push({
            orderId,
            trackingNumber,
            status: 'shipped'
        });
    });
    
    res.json({
        success: results.length,
        failed: errors.length,
        results,
        errors
    });
});

router.get('/warehouses', (req, res) => {
    const warehouses = [
        {
            id: 'main',
            name: 'Main Warehouse',
            address: '123 Warehouse St, Commerce City, CC 12345',
            active: true,
            capacity: 10000,
            currentLoad: 3500
        },
        {
            id: 'east',
            name: 'East Coast Distribution',
            address: '456 Distribution Ave, East City, EC 54321',
            active: true,
            capacity: 5000,
            currentLoad: 2100
        },
        {
            id: 'west',
            name: 'West Coast Hub',
            address: '789 Hub Blvd, West City, WC 98765',
            active: false,
            capacity: 7500,
            currentLoad: 0
        }
    ];
    
    res.json(warehouses);
});

module.exports = router;
