// Legacy notification service with multiple anti-patterns
var request = require('request'); // Deprecated library!

var NotificationService = function() {
    var self = this;
    
    // Hardcoded config - should be in env vars
    self.emailApiKey = 'sk_live_abc123xyz789'; // Exposed API key!
    self.emailApiUrl = 'https://api.emailservice.com/v1/send';
    self.slackWebhook = 'https://hooks.slack.com/services/T00/B00/XXX';
    
    // Callback hell for sending email
    self.sendEmail = function(to, subject, body, callback) {
        var options = {
            url: self.emailApiUrl,
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + self.emailApiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: to,
                subject: subject,
                body: body
            })
        };
        
        request(options, function(error, response, body) {
            if (error) {
                console.log('Email send error: ' + error);
                callback(error, null);
                return;
            }
            
            if (response.statusCode != 200) {
                callback('Email API error: ' + response.statusCode, null);
                return;
            }
            
            try {
                var result = JSON.parse(body);
                callback(null, result);
            } catch (e) {
                callback('Failed to parse response', null);
            }
        });
    };
    
    // Nested callbacks for notification workflow
    self.notifyTaskAssignment = function(task, user, callback) {
        var emailSubject = 'New Task Assigned: ' + task.title;
        var emailBody = 'You have been assigned a new task.\n\n' +
                       'Title: ' + task.title + '\n' +
                       'Priority: ' + task.priority + '\n' +
                       'Due Date: ' + task.due_date;
        
        // First send email
        self.sendEmail(user.email, emailSubject, emailBody, function(emailErr, emailResult) {
            if (emailErr) {
                console.log('Failed to send email: ' + emailErr);
                // Continue anyway
            }
            
            // Then send Slack notification
            self.sendSlackMessage('New task assigned to ' + user.name, function(slackErr, slackResult) {
                if (slackErr) {
                    console.log('Failed to send Slack: ' + slackErr);
                }
                
                // Then log to database
                self.logNotification(user.id, 'task_assignment', function(logErr, logResult) {
                    if (logErr) {
                        console.log('Failed to log: ' + logErr);
                    }
                    
                    // Finally callback with results
                    var success = !emailErr && !slackErr && !logErr;
                    callback(success ? null : 'Some notifications failed', {
                        email: emailResult,
                        slack: slackResult,
                        logged: logResult
                    });
                });
            });
        });
    };
    
    // Using deprecated request library
    self.sendSlackMessage = function(message, callback) {
        request.post(self.slackWebhook, {
            json: { text: message }
        }, function(error, response, body) {
            if (error) {
                callback(error, null);
            } else {
                callback(null, body);
            }
        });
    };
    
    // No connection pooling, opens new connection each time
    self.logNotification = function(userId, type, callback) {
        var mysql = require('mysql');
        var connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'password123',
            database: 'notifications'
        });
        
        connection.connect(function(err) {
            if (err) {
                callback(err, null);
                return;
            }
            
            var query = "INSERT INTO notification_log (user_id, type, timestamp) VALUES (" +
                       userId + ", '" + type + "', NOW())"; // SQL injection!
            
            connection.query(query, function(err, result) {
                connection.end(); // Connection closed after single query
                
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, result);
                }
            });
        });
    };
    
    // Sync operation that blocks
    self.formatNotificationBatch = function(notifications) {
        var formatted = [];
        
        for (var i = 0; i < notifications.length; i++) {
            var n = notifications[i];
            // Simulate heavy processing
            var start = Date.now();
            while (Date.now() - start < 10) {
                // Blocking loop!
            }
            
            formatted.push({
                id: n.id,
                message: 'Notification: ' + n.type + ' for user ' + n.user_id,
                timestamp: n.timestamp
            });
        }
        
        return formatted;
    };
};

module.exports = new NotificationService();

// Problems:
// 1. Deprecated 'request' library usage
// 2. Hardcoded secrets and API keys
// 3. Callback hell (4 levels deep!)
// 4. SQL injection vulnerability
// 5. No connection pooling
// 6. var instead of const/let
// 7. String concatenation
// 8. Poor error handling
// 9. Synchronous blocking operations
// 10. No TypeScript types
// 11. Creating new DB connections for each query
// 12. No retry logic for external services
