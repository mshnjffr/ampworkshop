// Legacy JavaScript with many issues - perfect for refactoring!
// Uses var, callbacks, no error handling, global functions, etc.

var currentTaskId = null;
var allTasks = [];

// Initialize app when page loads
window.onload = function() {
    loadTasks();
    setupEventListeners();
};

function setupEventListeners() {
    var form = document.getElementById('addTaskForm');
    form.onsubmit = function(e) {
        e.preventDefault();
        addTask();
    };
}

// Load all tasks - using old XMLHttpRequest!
function loadTasks() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/tasks', true);
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            try {
                allTasks = JSON.parse(xhr.responseText);
                displayTasks(allTasks);
                document.getElementById('loadingMessage').style.display = 'none';
            } catch(e) {
                showError('Failed to parse tasks');
            }
        } else {
            showError('Failed to load tasks');
        }
    };
    
    xhr.onerror = function() {
        showError('Network error while loading tasks');
    };
    
    xhr.send();
}

// Display tasks in the list
function displayTasks(tasks) {
    var taskList = document.getElementById('taskList');
    taskList.innerHTML = ''; // Bad practice: clearing innerHTML
    
    if (!tasks || tasks.length === 0) {
        taskList.innerHTML = '<li class="task-item">No tasks found. Add one above!</li>';
        return;
    }
    
    // Using var in loop - classic mistake!
    for (var i = 0; i < tasks.length; i++) {
        var task = tasks[i];
        var li = document.createElement('li');
        li.className = 'task-item';
        li.onclick = (function(taskId) {
            return function() {
                showTaskDetails(taskId);
            };
        })(task.id); // Closure to capture task id
        
        // Building HTML with string concatenation - XSS vulnerable!
        li.innerHTML = '<h3>' + task.title + '</h3>' +
                      '<div class="task-meta">' +
                      '<span class="priority ' + task.priority + '">' + 
                      task.priority.toUpperCase() + '</span>' +
                      '<span>Assigned to: ' + (task.assignee || 'Unassigned') + '</span>' +
                      '</div>';
        
        taskList.appendChild(li);
    }
}

// Add a new task - no validation!
function addTask() {
    var title = document.getElementById('taskTitle').value;
    var description = document.getElementById('taskDescription').value;
    var priority = document.getElementById('taskPriority').value;
    var assignee = document.getElementById('taskAssignee').value;
    
    var taskData = {
        title: title,
        description: description,
        priority: priority,
        assignee: assignee,
        status: 'pending',
        created_at: new Date().toISOString() // Should be handled by server!
    };
    
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/tasks', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            // Assuming task was created successfully
            alert('Task created!'); // Using alert - bad UX!
            document.getElementById('addTaskForm').reset();
            loadTasks(); // Reload all tasks - inefficient!
        } else {
            alert('Failed to create task');
        }
    };
    
    xhr.send(JSON.stringify(taskData));
}

// Show task details - global function
function showTaskDetails(taskId) {
    currentTaskId = taskId; // Global variable!
    
    // Finding task inefficiently
    var task = null;
    for (var i = 0; i < allTasks.length; i++) {
        if (allTasks[i].id === taskId) {
            task = allTasks[i];
            break;
        }
    }
    
    if (!task) {
        alert('Task not found!');
        return;
    }
    
    var detailsDiv = document.getElementById('taskDetails');
    // More string concatenation without escaping!
    detailsDiv.innerHTML = '<p><strong>Title:</strong> ' + task.title + '</p>' +
                          '<p><strong>Description:</strong> ' + (task.description || 'No description') + '</p>' +
                          '<p><strong>Priority:</strong> ' + task.priority + '</p>' +
                          '<p><strong>Status:</strong> ' + task.status + '</p>' +
                          '<p><strong>Assigned to:</strong> ' + (task.assignee || 'Unassigned') + '</p>' +
                          '<p><strong>Created:</strong> ' + task.created_at + '</p>';
    
    document.getElementById('taskModal').style.display = 'flex';
}

// Close modal - global function
function closeModal() {
    document.getElementById('taskModal').style.display = 'none';
    currentTaskId = null;
}

// Edit task - just alerts for now
function editTask() {
    alert('Edit functionality not implemented yet!');
}

// Delete task - no confirmation!
function deleteCurrentTask() {
    if (!currentTaskId) return;
    
    var xhr = new XMLHttpRequest();
    xhr.open('DELETE', '/tasks/' + currentTaskId, true);
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            alert('Task deleted!');
            closeModal();
            loadTasks(); // Reload everything again!
        } else {
            alert('Failed to delete task');
        }
    };
    
    xhr.send();
}

// Show error message
function showError(message) {
    var errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Hide loading message
    document.getElementById('loadingMessage').style.display = 'none';
    
    // Hide error after 5 seconds
    setTimeout(function() {
        errorDiv.style.display = 'none';
    }, 5000);
}

// Problems with this code:
// 1. Using var instead of let/const
// 2. Using XMLHttpRequest instead of fetch
// 3. Global functions and variables
// 4. No proper error handling
// 5. Using alerts for user feedback
// 6. Building HTML with string concatenation (XSS vulnerable)
// 7. No input validation
// 8. Inefficient data operations (reloading all tasks)
// 9. No loading states during operations
// 10. No TypeScript types
// 11. Callback-based instead of promises/async-await
// 12. No event delegation
// 13. Direct DOM manipulation
// 14. No state management
// 15. Mixed concerns (UI and data logic together)
