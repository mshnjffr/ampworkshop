const config = require('../config');

class Cache {
    constructor() {
        this.store = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0
        };
    }
    
    init() {
        console.log('Cache initialized');
        setInterval(() => this.cleanup(), 60000);
    }
    
    get(key) {
        const item = this.store.get(key);
        
        if (!item) {
            this.stats.misses++;
            return null;
        }
        
        if (item.expiry && item.expiry < Date.now()) {
            this.store.delete(key);
            this.stats.misses++;
            return null;
        }
        
        this.stats.hits++;
        item.accessCount++;
        item.lastAccessed = Date.now();
        
        return item.value;
    }
    
    set(key, value, ttl = config.CACHE_TTL) {
        const expiry = ttl ? Date.now() + (ttl * 1000) : null;
        
        this.store.set(key, {
            value,
            expiry,
            createdAt: Date.now(),
            lastAccessed: Date.now(),
            accessCount: 0
        });
        
        this.stats.sets++;
        
        if (this.store.size > 1000) {
            this.evict();
        }
    }
    
    delete(key) {
        const result = this.store.delete(key);
        if (result) {
            this.stats.deletes++;
        }
        return result;
    }
    
    invalidate(pattern) {
        let count = 0;
        
        if (pattern.endsWith('*')) {
            const prefix = pattern.slice(0, -1);
            for (const key of this.store.keys()) {
                if (key.startsWith(prefix)) {
                    this.store.delete(key);
                    count++;
                }
            }
        } else {
            if (this.store.delete(pattern)) {
                count = 1;
            }
        }
        
        this.stats.deletes += count;
        return count;
    }
    
    evict() {
        const entries = Array.from(this.store.entries());
        
        entries.sort((a, b) => {
            const scoreA = this.calculateEvictionScore(a[1]);
            const scoreB = this.calculateEvictionScore(b[1]);
            return scoreA - scoreB;
        });
        
        const toEvict = Math.floor(this.store.size * 0.2);
        
        for (let i = 0; i < toEvict; i++) {
            this.store.delete(entries[i][0]);
        }
    }
    
    calculateEvictionScore(item) {
        const age = Date.now() - item.createdAt;
        const recency = Date.now() - item.lastAccessed;
        const frequency = item.accessCount;
        
        const ageScore = age / 3600000;
        const recencyScore = recency / 60000;
        const frequencyScore = 1 / (frequency + 1);
        
        return ageScore * 0.3 + recencyScore * 0.5 + frequencyScore * 0.2;
    }
    
    cleanup() {
        let removed = 0;
        
        for (const [key, item] of this.store.entries()) {
            if (item.expiry && item.expiry < Date.now()) {
                this.store.delete(key);
                removed++;
            }
        }
        
        if (config.DEBUG && removed > 0) {
            console.log(`Cache cleanup: removed ${removed} expired items`);
        }
    }
    
    clear() {
        const size = this.store.size;
        this.store.clear();
        return size;
    }
    
    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0
            ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
            : 0;
        
        return {
            ...this.stats,
            size: this.store.size,
            hitRate: hitRate + '%'
        };
    }
    
    getAllKeys() {
        return Array.from(this.store.keys());
    }
    
    getMemoryUsage() {
        let totalSize = 0;
        
        for (const [key, item] of this.store.entries()) {
            totalSize += key.length;
            totalSize += JSON.stringify(item.value).length;
        }
        
        return {
            entries: this.store.size,
            approximateBytes: totalSize,
            approximateKB: (totalSize / 1024).toFixed(2),
            approximateMB: (totalSize / 1024 / 1024).toFixed(2)
        };
    }
}

module.exports = new Cache();
