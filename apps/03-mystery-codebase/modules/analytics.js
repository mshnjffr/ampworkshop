const db = require('../database');
const config = require('../config');

const analytics = {
    events: [],
    metrics: {},
    
    initialize() {
        this.metrics = {
            pageViews: 0,
            uniqueVisitors: new Set(),
            revenue: 0,
            orders: 0,
            averageOrderValue: 0,
            conversionRate: 0,
            topProducts: {},
            userActivity: {}
        };
        
        setInterval(() => this.flush(), 60000);
    },
    
    track(event) {
        this.events.push({
            ...event,
            timestamp: new Date().toISOString(),
            sessionId: event.sessionId || 'anonymous'
        });
        
        this.processEvent(event);
    },
    
    processEvent(event) {
        switch (event.type) {
            case 'pageView':
                this.metrics.pageViews++;
                this.metrics.uniqueVisitors.add(event.userId || event.sessionId);
                break;
                
            case 'purchase':
                this.metrics.orders++;
                this.metrics.revenue += event.amount;
                this.metrics.averageOrderValue = this.metrics.revenue / this.metrics.orders;
                
                if (event.items) {
                    event.items.forEach(item => {
                        if (!this.metrics.topProducts[item.productId]) {
                            this.metrics.topProducts[item.productId] = {
                                quantity: 0,
                                revenue: 0
                            };
                        }
                        this.metrics.topProducts[item.productId].quantity += item.quantity;
                        this.metrics.topProducts[item.productId].revenue += item.price * item.quantity;
                    });
                }
                break;
                
            case 'userAction':
                const userId = event.userId || 'anonymous';
                if (!this.metrics.userActivity[userId]) {
                    this.metrics.userActivity[userId] = {
                        actions: [],
                        lastSeen: null
                    };
                }
                this.metrics.userActivity[userId].actions.push(event.action);
                this.metrics.userActivity[userId].lastSeen = new Date().toISOString();
                break;
        }
    },
    
    getMetrics(period = 'all') {
        const now = new Date();
        let startDate;
        
        switch (period) {
            case 'hour':
                startDate = new Date(now - 3600000);
                break;
            case 'day':
                startDate = new Date(now - 86400000);
                break;
            case 'week':
                startDate = new Date(now - 604800000);
                break;
            case 'month':
                startDate = new Date(now - 2592000000);
                break;
            default:
                startDate = new Date(0);
        }
        
        const filteredEvents = this.events.filter(e => 
            new Date(e.timestamp) >= startDate
        );
        
        const periodMetrics = {
            period,
            startDate: startDate.toISOString(),
            endDate: now.toISOString(),
            totalEvents: filteredEvents.length,
            pageViews: filteredEvents.filter(e => e.type === 'pageView').length,
            purchases: filteredEvents.filter(e => e.type === 'purchase').length,
            uniqueUsers: new Set(filteredEvents.map(e => e.userId || e.sessionId)).size,
            revenue: filteredEvents
                .filter(e => e.type === 'purchase')
                .reduce((sum, e) => sum + (e.amount || 0), 0)
        };
        
        periodMetrics.conversionRate = periodMetrics.pageViews > 0 
            ? (periodMetrics.purchases / periodMetrics.pageViews * 100).toFixed(2) + '%'
            : '0%';
        
        return periodMetrics;
    },
    
    getTopProducts(limit = 10) {
        const products = Object.entries(this.metrics.topProducts)
            .map(([productId, stats]) => {
                const product = db.products.find(p => p.id === productId);
                return {
                    productId,
                    name: product?.name || 'Unknown Product',
                    ...stats
                };
            })
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, limit);
        
        return products;
    },
    
    getUserJourney(userId) {
        const userEvents = this.events.filter(e => 
            e.userId === userId || e.sessionId === userId
        );
        
        return userEvents.map(e => ({
            type: e.type,
            action: e.action,
            page: e.page,
            timestamp: e.timestamp
        }));
    },
    
    getFunnelAnalysis() {
        const funnel = {
            visited: new Set(),
            viewedProduct: new Set(),
            addedToCart: new Set(),
            startedCheckout: new Set(),
            completed: new Set()
        };
        
        this.events.forEach(event => {
            const user = event.userId || event.sessionId;
            
            if (event.type === 'pageView') {
                funnel.visited.add(user);
                
                if (event.page && event.page.includes('/product')) {
                    funnel.viewedProduct.add(user);
                }
            }
            
            if (event.type === 'userAction') {
                if (event.action === 'addToCart') {
                    funnel.addedToCart.add(user);
                }
                if (event.action === 'startCheckout') {
                    funnel.startedCheckout.add(user);
                }
            }
            
            if (event.type === 'purchase') {
                funnel.completed.add(user);
            }
        });
        
        return {
            visited: funnel.visited.size,
            viewedProduct: funnel.viewedProduct.size,
            addedToCart: funnel.addedToCart.size,
            startedCheckout: funnel.startedCheckout.size,
            completed: funnel.completed.size,
            conversionRates: {
                visitToView: funnel.visited.size > 0 
                    ? (funnel.viewedProduct.size / funnel.visited.size * 100).toFixed(2) + '%'
                    : '0%',
                viewToCart: funnel.viewedProduct.size > 0
                    ? (funnel.addedToCart.size / funnel.viewedProduct.size * 100).toFixed(2) + '%'
                    : '0%',
                cartToCheckout: funnel.addedToCart.size > 0
                    ? (funnel.startedCheckout.size / funnel.addedToCart.size * 100).toFixed(2) + '%'
                    : '0%',
                checkoutToComplete: funnel.startedCheckout.size > 0
                    ? (funnel.completed.size / funnel.startedCheckout.size * 100).toFixed(2) + '%'
                    : '0%',
                overall: funnel.visited.size > 0
                    ? (funnel.completed.size / funnel.visited.size * 100).toFixed(2) + '%'
                    : '0%'
            }
        };
    },
    
    getRevenueAnalytics() {
        const orders = db.orders.filter(o => o.status === 'delivered' || o.status === 'paid');
        
        const revenueByDay = {};
        const revenueByProduct = {};
        const revenueByCategory = {};
        
        orders.forEach(order => {
            const date = new Date(order.createdAt).toISOString().split('T')[0];
            
            if (!revenueByDay[date]) {
                revenueByDay[date] = 0;
            }
            revenueByDay[date] += order.total;
            
            order.items.forEach(item => {
                const product = db.products.find(p => p.id === item.productId);
                
                if (!revenueByProduct[item.productId]) {
                    revenueByProduct[item.productId] = {
                        name: product?.name || 'Unknown',
                        revenue: 0,
                        units: 0
                    };
                }
                revenueByProduct[item.productId].revenue += item.price * item.quantity;
                revenueByProduct[item.productId].units += item.quantity;
                
                if (product) {
                    if (!revenueByCategory[product.category]) {
                        revenueByCategory[product.category] = 0;
                    }
                    revenueByCategory[product.category] += item.price * item.quantity;
                }
            });
        });
        
        return {
            totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
            orderCount: orders.length,
            averageOrderValue: orders.length > 0 
                ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length
                : 0,
            revenueByDay,
            topProducts: Object.entries(revenueByProduct)
                .sort((a, b) => b[1].revenue - a[1].revenue)
                .slice(0, 5),
            revenueByCategory
        };
    },
    
    flush() {
        if (this.events.length > 10000) {
            this.events = this.events.slice(-5000);
        }
        
        if (config.ENABLE_METRICS) {
            console.log('Analytics flush:', {
                events: this.events.length,
                metrics: {
                    pageViews: this.metrics.pageViews,
                    uniqueVisitors: this.metrics.uniqueVisitors.size,
                    revenue: this.metrics.revenue
                }
            });
        }
    },
    
    reset() {
        this.events = [];
        this.initialize();
    }
};

module.exports = analytics;
