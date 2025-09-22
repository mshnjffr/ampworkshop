var db = require('../database/connection');
var async = require('async');
var request = require('request');

function UserController() {
    this.users = [];
}

UserController.prototype.getUserById = function(id, callback) {
    var self = this;
    var query = "SELECT * FROM users WHERE id = " + id;
    
    db.query(query, function(err, results) {
        if (err) {
            callback(err);
            return;
        }
        
        if (results.length == 0) {
            callback('User not found');
            return;
        }
        
        var user = results[0];
        // Fetch additional data with nested callbacks
        self.getUserProfile(user.id, function(err, profile) {
            if (!err) {
                user.profile = profile;
            }
            
            self.getUserPermissions(user.id, function(err, permissions) {
                if (!err) {
                    user.permissions = permissions;
                }
                
                callback(null, user);
            });
        });
    });
};

UserController.prototype.createUser = function(userData, callback) {
    var username = userData.username;
    var email = userData.email;
    var password = userData.password; // Storing password in plain text!
    
    // Check if user exists with callback hell
    var checkQuery = "SELECT * FROM users WHERE email = '" + email + "'";
    
    db.query(checkQuery, function(err, results) {
        if (err) {
            callback(err);
            return;
        }
        
        if (results.length > 0) {
            callback('User already exists');
            return;
        }
        
        var insertQuery = "INSERT INTO users (username, email, password) VALUES ('" + 
                         username + "', '" + email + "', '" + password + "')";
        
        db.query(insertQuery, function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null, {id: result.insertId});
            }
        });
    });
};

UserController.prototype.authenticateUser = function(email, password, callback) {
    var query = "SELECT * FROM users WHERE email = '" + email + "' AND password = '" + password + "'";
    
    db.query(query, function(err, results) {
        if (err) {
            callback(err);
            return;
        }
        
        if (results.length == 0) {
            callback('Invalid credentials');
        } else {
            // No token generation, just return user
            callback(null, results[0]);
        }
    });
};

UserController.prototype.getUserProfile = function(userId, callback) {
    var query = "SELECT * FROM user_profiles WHERE user_id = " + userId;
    
    db.query(query, function(err, results) {
        if (err) {
            callback(err);
        } else {
            callback(null, results[0] || {});
        }
    });
};

UserController.prototype.getUserPermissions = function(userId, callback) {
    var query = "SELECT * FROM user_permissions WHERE user_id = " + userId;
    
    db.query(query, function(err, results) {
        if (err) {
            callback(err);
        } else {
            var permissions = [];
            for (var i = 0; i < results.length; i++) {
                permissions.push(results[i].permission);
            }
            callback(null, permissions);
        }
    });
};

// Using old request library for external API calls
UserController.prototype.syncUserWithExternalService = function(userId, callback) {
    var self = this;
    
    self.getUserById(userId, function(err, user) {
        if (err) {
            callback(err);
            return;
        }
        
        var options = {
            url: 'http://external-api.com/users',
            method: 'POST',
            json: {
                email: user.email,
                name: user.username
            }
        };
        
        request(options, function(error, response, body) {
            if (error) {
                callback(error);
            } else if (response.statusCode != 200) {
                callback('External sync failed');
            } else {
                callback(null, body);
            }
        });
    });
};

module.exports = new UserController();
