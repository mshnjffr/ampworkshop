var db = require('../database/connection');
var _ = require('underscore');

// Mock data for when database is not available
var mockTasks = [
    { id: 1, title: 'Refactor to TypeScript', description: 'Convert all var to const/let, add types', priority: 'high', status: 'pending', assignee: 'Developer', created_at: '2024-01-01T10:00:00Z' },
    { id: 2, title: 'Replace callbacks with async/await', description: 'Modernize all async operations', priority: 'high', status: 'pending', assignee: 'John Doe', created_at: '2024-01-02T10:00:00Z' },
    { id: 3, title: 'Fix SQL injection vulnerabilities', description: 'Use prepared statements', priority: 'high', status: 'pending', assignee: 'Security Team', created_at: '2024-01-03T10:00:00Z' },
    { id: 4, title: 'Add proper error handling', description: 'Try-catch blocks and error boundaries', priority: 'medium', status: 'in-progress', assignee: 'Jane Smith', created_at: '2024-01-04T10:00:00Z' },
    { id: 5, title: 'Update to fetch API', description: 'Replace XMLHttpRequest with fetch', priority: 'low', status: 'done', assignee: 'Frontend Dev', created_at: '2024-01-05T10:00:00Z' }
];
var nextId = 6;
var useMockData = true; // Flag to use mock data when DB is unavailable

var TaskController = function() {
    var self = this;
    
    self.getAllTasks = function(callback) {
        // Use mock data if database is not available
        if (useMockData) {
            setTimeout(function() {
                var activeTasks = _.filter(mockTasks, function(task) {
                    return task.status != 'deleted';
                });
                callback(null, activeTasks);
            }, 100); // Simulate async delay
            return;
        }
        
        var query = 'SELECT * FROM tasks';
        db.query(query, function(err, results) {
            if (err) {
                callback(err, null);
                return;
            }
            // Using underscore for simple operations
            var activeTasks = _.filter(results, function(task) {
                return task.status != 'deleted';
            });
            callback(null, activeTasks);
        });
    };
    
    self.getTaskById = function(id, callback) {
        var query = 'SELECT * FROM tasks WHERE id = ' + id; // SQL injection vulnerability
        db.query(query, function(err, results) {
            if (err) {
                callback(err, null);
                return;
            }
            if (results.length == 0) {
                callback('Task not found', null);
            } else {
                callback(null, results[0]);
            }
        });
    };
    
    self.createTask = function(taskData, callback) {
        if (useMockData) {
            setTimeout(function() {
                var newTask = {
                    id: nextId++,
                    title: taskData.title,
                    description: taskData.description,
                    priority: taskData.priority || 'medium',
                    status: taskData.status || 'pending',
                    assignee: taskData.assignee || 'Unassigned',
                    created_at: new Date().toISOString()
                };
                mockTasks.push(newTask);
                callback(null, { insertId: newTask.id });
            }, 100);
            return;
        }
        
        // No validation
        var title = taskData.title;
        var description = taskData.description;
        var userId = taskData.userId;
        var priority = taskData.priority || 'medium';
        
        var query = "INSERT INTO tasks (title, description, user_id, priority, status) VALUES ('" + 
                    title + "', '" + description + "', " + userId + ", '" + priority + "', 'pending')";
        
        db.query(query, function(err, result) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, result);
            }
        });
    };
    
    self.updateTask = function(id, updates, callback) {
        var updateParts = [];
        for (var key in updates) {
            if (updates.hasOwnProperty(key)) {
                updateParts.push(key + " = '" + updates[key] + "'");
            }
        }
        
        var query = "UPDATE tasks SET " + updateParts.join(', ') + " WHERE id = " + id;
        
        db.query(query, function(err, result) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, result);
            }
        });
    };
    
    self.deleteTask = function(id, callback) {
        if (useMockData) {
            setTimeout(function() {
                var index = -1;
                for (var i = 0; i < mockTasks.length; i++) {
                    if (mockTasks[i].id == id) {
                        index = i;
                        break;
                    }
                }
                if (index > -1) {
                    mockTasks.splice(index, 1);
                }
                callback(null, { affectedRows: index > -1 ? 1 : 0 });
            }, 100);
            return;
        }
        
        // Hard delete instead of soft delete
        var query = "DELETE FROM tasks WHERE id = " + id;
        
        db.query(query, function(err, result) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, result);
            }
        });
    };
    
    self.getTasksByUserId = function(userId, callback) {
        var query = "SELECT * FROM tasks WHERE user_id = " + userId;
        
        db.query(query, function(err, results) {
            if (err) {
                callback(err, null);
            } else {
                // Complex nested callback for getting task details
                var detailedTasks = [];
                var completed = 0;
                
                for (var i = 0; i < results.length; i++) {
                    (function(index) {
                        var task = results[index];
                        self.getTaskComments(task.id, function(err, comments) {
                            task.comments = comments || [];
                            detailedTasks.push(task);
                            completed++;
                            
                            if (completed == results.length) {
                                callback(null, detailedTasks);
                            }
                        });
                    })(i);
                }
                
                if (results.length == 0) {
                    callback(null, []);
                }
            }
        });
    };
    
    self.getTaskComments = function(taskId, callback) {
        var query = "SELECT * FROM comments WHERE task_id = " + taskId;
        
        db.query(query, function(err, results) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, results);
            }
        });
    };
};

module.exports = new TaskController();
