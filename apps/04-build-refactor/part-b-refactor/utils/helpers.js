// Legacy helper functions with outdated patterns
var _ = require('underscore');
var async = require('async');

// Using var and old module.exports pattern
var helpers = {
    // Callback-based validation
    validateTask: function(task, callback) {
        setTimeout(function() {
            var errors = [];
            
            if (!task.title || task.title.length == 0) {
                errors.push('Title is required');
            }
            
            if (task.title && task.title.length > 100) {
                errors.push('Title too long');
            }
            
            if (errors.length > 0) {
                callback(errors.join(', '), false);
            } else {
                callback(null, true);
            }
        }, 10);
    },
    
    // Using underscore for simple operations
    filterActiveTasks: function(tasks) {
        return _.filter(tasks, function(task) {
            return task.status != 'deleted' && task.status != 'archived';
        });
    },
    
    // Nested callbacks for async operations
    processTaskBatch: function(tasks, processor, callback) {
        var results = [];
        var errors = [];
        
        async.each(tasks, function(task, cb) {
            processor(task, function(err, result) {
                if (err) {
                    errors.push(err);
                    cb(); // Continue processing
                } else {
                    results.push(result);
                    cb();
                }
            });
        }, function(err) {
            if (errors.length > 0) {
                callback('Some tasks failed: ' + errors.join(', '), results);
            } else {
                callback(null, results);
            }
        });
    },
    
    // String manipulation without template literals
    formatTaskSummary: function(task) {
        return 'Task #' + task.id + ': ' + task.title + ' (' + task.status + ')';
    },
    
    // Date formatting without modern APIs
    formatDate: function(dateString) {
        var date = new Date(dateString);
        var day = date.getDate();
        var month = date.getMonth() + 1;
        var year = date.getFullYear();
        
        if (day < 10) day = '0' + day;
        if (month < 10) month = '0' + month;
        
        return month + '/' + day + '/' + year;
    },
    
    // Manual array operations instead of modern methods
    findTaskById: function(tasks, id) {
        for (var i = 0; i < tasks.length; i++) {
            if (tasks[i].id == id) { // Loose equality!
                return tasks[i];
            }
        }
        return null;
    },
    
    // Synchronous heavy computation (blocking!)
    calculateTaskMetrics: function(tasks) {
        var metrics = {
            total: 0,
            completed: 0,
            pending: 0,
            overdue: 0
        };
        
        for (var i = 0; i < tasks.length; i++) {
            var task = tasks[i];
            metrics.total++;
            
            if (task.status == 'completed') {
                metrics.completed++;
            } else if (task.status == 'pending') {
                metrics.pending++;
            }
            
            // Inefficient date comparison
            var dueDate = new Date(task.due_date);
            var now = new Date();
            if (dueDate < now && task.status != 'completed') {
                metrics.overdue++;
            }
        }
        
        metrics.completionRate = (metrics.completed / metrics.total * 100).toFixed(2) + '%';
        return metrics;
    },
    
    // No error handling
    parseJSON: function(jsonString) {
        return JSON.parse(jsonString); // Will throw if invalid!
    },
    
    // Magic numbers and hardcoded values
    getPriorityScore: function(priority) {
        if (priority == 'high') return 3;
        if (priority == 'medium') return 2;
        if (priority == 'low') return 1;
        return 0;
    }
};

module.exports = helpers;

// Problems:
// 1. var instead of const/let
// 2. Callback-based async functions
// 3. Using underscore for simple operations
// 4. Manual loops instead of array methods
// 5. String concatenation instead of template literals
// 6. Loose equality (==) instead of strict (===)
// 7. No TypeScript types
// 8. No error handling in parseJSON
// 9. Magic numbers
// 10. Synchronous blocking operations
