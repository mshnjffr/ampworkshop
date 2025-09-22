const express = require('express');
const db = require('../database');
const cache = require('./cache');
const { authenticate } = require('./auth');

const router = express.Router();

router.get('/', (req, res) => {
    const { category, minPrice, maxPrice, search, sort } = req.query;
    
    let products = [...db.products];
    
    if (category) {
        products = products.filter(p => p.category === category);
    }
    
    if (minPrice) {
        products = products.filter(p => p.price >= parseFloat(minPrice));
    }
    
    if (maxPrice) {
        products = products.filter(p => p.price <= parseFloat(maxPrice));
    }
    
    if (search) {
        const searchQuery = search.toLowerCase();
        products = products.filter(p => 
            p.name.toLowerCase().includes(searchQuery) ||
            p.description.toLowerCase().includes(searchQuery) ||
            p.tags.some(tag => tag.toLowerCase().includes(searchQuery))
        );
    }
    
    if (sort === 'price_asc') {
        products.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
        products.sort((a, b) => b.price - a.price);
    } else if (sort === 'name') {
        products.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    res.json(products);
});

router.get('/:id', (req, res) => {
    const cacheKey = `product:${req.params.id}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
        return res.json(cached);
    }
    
    const product = db.products.find(p => p.id === req.params.id);
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }
    
    const inventory = db.inventory.find(i => i.productId === product.id);
    const productWithInventory = {
        ...product,
        available: inventory ? inventory.quantity - inventory.reserved : 0
    };
    
    cache.set(cacheKey, productWithInventory);
    res.json(productWithInventory);
});

router.post('/', authenticate, (req, res) => {
    const { name, price, category, stock, description, tags, vendor } = req.body;
    
    if (req.user.role !== 'admin' && req.user.role !== 'vendor') {
        return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const newProduct = {
        id: 'p' + db.generateId(),
        name,
        price: parseFloat(price),
        category,
        stock: parseInt(stock),
        description,
        tags: tags || [],
        vendor: vendor || req.user.username,
        createdBy: req.user.id,
        createdAt: new Date().toISOString()
    };
    
    db.products.push(newProduct);
    
    db.inventory.push({
        productId: newProduct.id,
        warehouse: 'main',
        quantity: newProduct.stock,
        reserved: 0,
        lastUpdated: new Date().toISOString()
    });
    
    cache.invalidate('products:*');
    
    res.status(201).json(newProduct);
});

router.put('/:id', authenticate, (req, res) => {
    const productIndex = db.products.findIndex(p => p.id === req.params.id);
    
    if (productIndex === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = db.products[productIndex];
    
    if (req.user.role !== 'admin' && product.createdBy !== req.user.id) {
        return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const updatedProduct = {
        ...product,
        ...req.body,
        id: product.id,
        updatedBy: req.user.id,
        updatedAt: new Date().toISOString()
    };
    
    db.products[productIndex] = updatedProduct;
    
    cache.invalidate(`product:${req.params.id}`);
    cache.invalidate('products:*');
    
    res.json(updatedProduct);
});

router.delete('/:id', authenticate, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    const productIndex = db.products.findIndex(p => p.id === req.params.id);
    
    if (productIndex === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }
    
    const deletedProduct = db.products.splice(productIndex, 1)[0];
    
    const inventoryIndex = db.inventory.findIndex(i => i.productId === req.params.id);
    if (inventoryIndex !== -1) {
        db.inventory.splice(inventoryIndex, 1);
    }
    
    cache.invalidate(`product:${req.params.id}`);
    cache.invalidate('products:*');
    
    res.json({ message: 'Product deleted', product: deletedProduct });
});

router.get('/:id/reviews', (req, res) => {
    const reviews = [
        { id: 1, rating: 5, comment: 'Great product!', userId: '2' },
        { id: 2, rating: 4, comment: 'Good value', userId: '3' }
    ];
    res.json(reviews);
});

router.post('/:id/reviews', authenticate, (req, res) => {
    const { rating, comment } = req.body;
    
    const product = db.products.find(p => p.id === req.params.id);
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }
    
    const review = {
        id: db.generateId(),
        productId: req.params.id,
        userId: req.user.id,
        rating,
        comment,
        createdAt: new Date().toISOString()
    };
    
    res.status(201).json(review);
});

module.exports = router;
