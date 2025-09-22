const crypto = require('crypto');

const database = {
    users: [
        {
            id: '1',
            username: 'admin',
            password: 'admin123',
            email: 'admin@shop.com',
            role: 'admin',
            balance: 10000,
            createdAt: '2023-01-01T00:00:00Z'
        },
        {
            id: '2',
            username: 'testuser',
            password: 'password',
            email: 'test@example.com',
            role: 'customer',
            balance: 500,
            createdAt: '2023-06-15T10:30:00Z'
        }
    ],
    
    products: [
        {
            id: 'p1',
            name: 'Laptop Pro X',
            price: 1299.99,
            category: 'electronics',
            stock: 25,
            description: 'High-performance laptop',
            tags: ['computer', 'tech', 'premium'],
            vendor: 'TechCorp'
        },
        {
            id: 'p2',
            name: 'Wireless Mouse',
            price: 29.99,
            category: 'accessories',
            stock: 150,
            description: 'Ergonomic wireless mouse',
            tags: ['mouse', 'wireless', 'accessories'],
            vendor: 'PeripheralsInc'
        },
        {
            id: 'p3',
            name: 'USB-C Hub',
            price: 49.99,
            category: 'accessories',
            stock: 75,
            description: '7-in-1 USB-C hub',
            tags: ['hub', 'usb', 'adapter'],
            vendor: 'ConnectGear'
        }
    ],
    
    orders: [
        {
            id: 'ord1',
            userId: '2',
            items: [
                { productId: 'p1', quantity: 1, price: 1299.99 },
                { productId: 'p2', quantity: 2, price: 29.99 }
            ],
            total: 1359.97,
            status: 'delivered',
            shippingAddress: '123 Main St, City, ST 12345',
            createdAt: '2023-07-01T14:22:00Z'
        }
    ],
    
    payments: [
        {
            id: 'pay1',
            orderId: 'ord1',
            amount: 1359.97,
            method: 'credit_card',
            status: 'completed',
            transactionId: 'txn_abc123xyz',
            metadata: {
                cardLast4: '4242',
                processor: 'stripe'
            },
            createdAt: '2023-07-01T14:23:00Z'
        }
    ],
    
    sessions: [],
    
    inventory: [
        {
            productId: 'p1',
            warehouse: 'main',
            quantity: 25,
            reserved: 3,
            lastUpdated: '2023-08-01T00:00:00Z'
        },
        {
            productId: 'p2',
            warehouse: 'main',
            quantity: 150,
            reserved: 10,
            lastUpdated: '2023-08-01T00:00:00Z'
        }
    ],
    
    generateId: function() {
        return crypto.randomBytes(16).toString('hex');
    },
    
    findById: function(collection, id) {
        return this[collection].find(item => item.id === id);
    },
    
    insert: function(collection, data) {
        const newItem = {
            id: this.generateId(),
            ...data,
            createdAt: new Date().toISOString()
        };
        this[collection].push(newItem);
        return newItem;
    },
    
    update: function(collection, id, data) {
        const index = this[collection].findIndex(item => item.id === id);
        if (index !== -1) {
            this[collection][index] = { ...this[collection][index], ...data };
            return this[collection][index];
        }
        return null;
    },
    
    delete: function(collection, id) {
        const index = this[collection].findIndex(item => item.id === id);
        if (index !== -1) {
            return this[collection].splice(index, 1)[0];
        }
        return null;
    }
};

module.exports = database;
