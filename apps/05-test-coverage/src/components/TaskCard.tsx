import React from 'react';
import { Task } from '../types';
import { formatDate, getDaysUntilDeadline, isOverdue } from '../utils/dateUtils';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onEdit, 
  onDelete, 
  onStatusChange 
}) => {
  const daysUntilDeadline = task.deadline ? getDaysUntilDeadline(task.deadline) : null;
  const overdue = task.deadline ? isOverdue(task.deadline) : false;

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'done': return 'green';
      case 'in-progress': return 'blue';
      case 'review': return 'purple';
      case 'todo': return 'gray';
      default: return 'gray';
    }
  };

  return (
    <div className="task-card" data-testid="task-card">
      <div className="task-header">
        <h3 className="task-title">{task.title}</h3>
        <div className="task-actions">
          <button onClick={() => onEdit(task)} aria-label="Edit task">
            Edit
          </button>
          <button onClick={() => onDelete(task.id)} aria-label="Delete task">
            Delete
          </button>
        </div>
      </div>

      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      <div className="task-meta">
        <span 
          className={`priority priority-${task.priority}`}
          style={{ color: getPriorityColor(task.priority) }}
        >
          {task.priority}
        </span>
        
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value as Task['status'])}
          style={{ color: getStatusColor(task.status) }}
          aria-label="Task status"
        >
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
      </div>

      {task.deadline && (
        <div className={`deadline ${overdue ? 'overdue' : ''}`}>
          <span>Deadline: {formatDate(task.deadline, 'MMM dd, yyyy')}</span>
          {daysUntilDeadline !== null && (
            <span className="days-remaining">
              {overdue 
                ? `Overdue by ${Math.abs(daysUntilDeadline)} days`
                : `${daysUntilDeadline} days remaining`
              }
            </span>
          )}
        </div>
      )}

      {task.tags && task.tags.length > 0 && (
        <div className="task-tags">
          {task.tags.map((tag, index) => (
            <span key={index} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      {task.assignees && task.assignees.length > 0 && (
        <div className="task-assignees">
          {task.assignees.map((assignee, index) => (
            <span key={index} className="assignee" title={assignee}>
              {assignee.charAt(0).toUpperCase()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
