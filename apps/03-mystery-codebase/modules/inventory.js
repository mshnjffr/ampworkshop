const express = require('express');
const db = require('../database');
const { authenticate, isAdmin } = require('./auth');
const cache = require('./cache');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
    const { warehouse, productId, lowStock } = req.query;
    
    let inventory = [...db.inventory];
    
    if (warehouse) {
        inventory = inventory.filter(i => i.warehouse === warehouse);
    }
    
    if (productId) {
        inventory = inventory.filter(i => i.productId === productId);
    }
    
    if (lowStock === 'true') {
        inventory = inventory.filter(i => (i.quantity - i.reserved) < 10);
    }
    
    const inventoryWithProducts = inventory.map(item => {
        const product = db.products.find(p => p.id === item.productId);
        return {
            ...item,
            product,
            available: item.quantity - item.reserved
        };
    });
    
    res.json(inventoryWithProducts);
});

router.get('/:productId', authenticate, (req, res) => {
    const inventoryItems = db.inventory.filter(i => i.productId === req.params.productId);
    
    if (inventoryItems.length === 0) {
        return res.status(404).json({ error: 'No inventory found for product' });
    }
    
    const product = db.products.find(p => p.id === req.params.productId);
    
    const totalQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalReserved = inventoryItems.reduce((sum, item) => sum + item.reserved, 0);
    
    res.json({
        productId: req.params.productId,
        product,
        warehouses: inventoryItems,
        totals: {
            quantity: totalQuantity,
            reserved: totalReserved,
            available: totalQuantity - totalReserved
        }
    });
});

router.post('/adjust', authenticate, isAdmin, (req, res) => {
    const { productId, warehouse, adjustment, reason } = req.body;
    
    let inventoryItem = db.inventory.find(
        i => i.productId === productId && i.warehouse === warehouse
    );
    
    if (!inventoryItem) {
        inventoryItem = {
            productId,
            warehouse,
            quantity: 0,
            reserved: 0,
            lastUpdated: new Date().toISOString()
        };
        db.inventory.push(inventoryItem);
    }
    
    const oldQuantity = inventoryItem.quantity;
    inventoryItem.quantity += adjustment;
    
    if (inventoryItem.quantity < 0) {
        return res.status(400).json({ 
            error: 'Inventory cannot be negative',
            current: oldQuantity,
            adjustment,
            wouldBe: inventoryItem.quantity
        });
    }
    
    if (inventoryItem.quantity < inventoryItem.reserved) {
        return res.status(400).json({ 
            error: 'Cannot reduce inventory below reserved quantity',
            reserved: inventoryItem.reserved
        });
    }
    
    inventoryItem.lastUpdated = new Date().toISOString();
    
    const log = {
        id: db.generateId(),
        productId,
        warehouse,
        type: adjustment > 0 ? 'restock' : 'adjustment',
        quantity: adjustment,
        reason,
        performedBy: req.user.id,
        timestamp: new Date().toISOString()
    };
    
    cache.invalidate(`product:${productId}`);
    
    res.json({
        inventoryItem,
        log,
        oldQuantity,
        newQuantity: inventoryItem.quantity
    });
});

router.post('/transfer', authenticate, isAdmin, (req, res) => {
    const { productId, fromWarehouse, toWarehouse, quantity } = req.body;
    
    if (fromWarehouse === toWarehouse) {
        return res.status(400).json({ error: 'Cannot transfer to same warehouse' });
    }
    
    const fromInventory = db.inventory.find(
        i => i.productId === productId && i.warehouse === fromWarehouse
    );
    
    if (!fromInventory) {
        return res.status(404).json({ error: 'Source inventory not found' });
    }
    
    const available = fromInventory.quantity - fromInventory.reserved;
    
    if (available < quantity) {
        return res.status(400).json({ 
            error: 'Insufficient available inventory',
            available,
            requested: quantity
        });
    }
    
    let toInventory = db.inventory.find(
        i => i.productId === productId && i.warehouse === toWarehouse
    );
    
    if (!toInventory) {
        toInventory = {
            productId,
            warehouse: toWarehouse,
            quantity: 0,
            reserved: 0,
            lastUpdated: new Date().toISOString()
        };
        db.inventory.push(toInventory);
    }
    
    fromInventory.quantity -= quantity;
    toInventory.quantity += quantity;
    
    fromInventory.lastUpdated = new Date().toISOString();
    toInventory.lastUpdated = new Date().toISOString();
    
    const transfer = {
        id: db.generateId(),
        productId,
        fromWarehouse,
        toWarehouse,
        quantity,
        status: 'completed',
        performedBy: req.user.id,
        timestamp: new Date().toISOString()
    };
    
    cache.invalidate(`product:${productId}`);
    
    res.json({
        transfer,
        fromInventory,
        toInventory
    });
});

router.get('/reports/low-stock', authenticate, (req, res) => {
    const threshold = parseInt(req.query.threshold) || 10;
    
    const lowStockItems = db.inventory
        .filter(item => (item.quantity - item.reserved) < threshold)
        .map(item => {
            const product = db.products.find(p => p.id === item.productId);
            return {
                ...item,
                product,
                available: item.quantity - item.reserved,
                percentReserved: item.reserved > 0 
                    ? Math.round((item.reserved / item.quantity) * 100) 
                    : 0
            };
        })
        .sort((a, b) => a.available - b.available);
    
    res.json({
        threshold,
        count: lowStockItems.length,
        items: lowStockItems
    });
});

router.get('/reports/turnover', authenticate, isAdmin, (req, res) => {
    const days = parseInt(req.query.days) || 30;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const recentOrders = db.orders.filter(
        o => new Date(o.createdAt) >= cutoffDate && o.status === 'delivered'
    );
    
    const productSales = {};
    
    recentOrders.forEach(order => {
        order.items.forEach(item => {
            if (!productSales[item.productId]) {
                productSales[item.productId] = {
                    productId: item.productId,
                    totalQuantity: 0,
                    totalRevenue: 0,
                    orderCount: 0
                };
            }
            productSales[item.productId].totalQuantity += item.quantity;
            productSales[item.productId].totalRevenue += item.quantity * item.price;
            productSales[item.productId].orderCount += 1;
        });
    });
    
    const turnoverReport = Object.values(productSales).map(sales => {
        const product = db.products.find(p => p.id === sales.productId);
        const inventory = db.inventory.find(i => i.productId === sales.productId);
        
        const turnoverRate = inventory && inventory.quantity > 0
            ? (sales.totalQuantity / inventory.quantity) * (365 / days)
            : 0;
        
        return {
            ...sales,
            product,
            currentStock: inventory ? inventory.quantity : 0,
            turnoverRate: Math.round(turnoverRate * 100) / 100,
            averageOrderSize: Math.round(sales.totalQuantity / sales.orderCount * 100) / 100
        };
    }).sort((a, b) => b.turnoverRate - a.turnoverRate);
    
    res.json({
        period: `${days} days`,
        startDate: cutoffDate.toISOString(),
        endDate: new Date().toISOString(),
        products: turnoverReport
    });
});

module.exports = router;
