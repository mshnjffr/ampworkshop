var mysql = require('mysql');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password123', // Hardcoded credentials!
    database: 'taskmanager'
});

// Global connection object
global.dbConnection = connection;

module.exports = connection;
