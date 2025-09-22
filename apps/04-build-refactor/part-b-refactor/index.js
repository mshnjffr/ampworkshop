var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var taskController = require('./controllers/taskController');
var userController = require('./controllers/userController');
var dbConnection = require('./database/connection');

var app = express();
var PORT = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// No error handling on database connection
dbConnection.connect(function(err) {
    if (err) {
        console.log('Database connection failed');
    }
    console.log('Connected to database');
});

// Routes with callback hell
app.get('/tasks', function(req, res) {
    taskController.getAllTasks(function(err, tasks) {
        if (err) {
            res.status(500).send('Error getting tasks');
        } else {
            res.json(tasks);
        }
    });
});

app.get('/tasks/:id', function(req, res) {
    var taskId = req.params.id;
    taskController.getTaskById(taskId, function(err, task) {
        if (err) {
            res.status(500).send('Error getting task');
        } else {
            res.json(task);
        }
    });
});

app.post('/tasks', function(req, res) {
    var taskData = req.body;
    // No validation
    taskController.createTask(taskData, function(err, result) {
        if (err) {
            res.status(500).send('Error creating task');
        } else {
            res.json({id: result.insertId});
        }
    });
});

app.put('/tasks/:id', function(req, res) {
    var taskId = req.params.id;
    var updates = req.body;
    taskController.updateTask(taskId, updates, function(err, result) {
        if (err) {
            res.status(500).send('Error updating task');
        } else {
            res.json({updated: true});
        }
    });
});

app.delete('/tasks/:id', function(req, res) {
    var taskId = req.params.id;
    taskController.deleteTask(taskId, function(err, result) {
        if (err) {
            res.status(500).send('Error deleting task');
        } else {
            res.json({deleted: true});
        }
    });
});

// User routes with nested callbacks
app.get('/users/:userId/tasks', function(req, res) {
    var userId = req.params.userId;
    userController.getUserById(userId, function(err, user) {
        if (err) {
            res.status(500).send('Error getting user');
        } else {
            taskController.getTasksByUserId(userId, function(err, tasks) {
                if (err) {
                    res.status(500).send('Error getting user tasks');
                } else {
                    res.json({
                        user: user,
                        tasks: tasks
                    });
                }
            });
        }
    });
});

app.listen(PORT, function() {
    console.log('Server running on port ' + PORT);
});
