import React, { useState, useCallback, useRef, useEffect } from 'react';

export interface TaskData {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  dueDate?: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  estimatedHours?: number;
  actualHours?: number;
  comments?: Comment[];
  subtasks?: Subtask[];
  progress?: number;
}

interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: Date;
  edited?: boolean;
}

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  order: number;
}

interface TaskItemProps {
  task: TaskData;
  onEdit?: (task: TaskData) => void;
  onDelete?: (taskId: string) => void;
  onStatusChange?: (taskId: string, newStatus: TaskData['status']) => void;
  onAddComment?: (taskId: string, comment: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  onTimeLog?: (taskId: string, hours: number) => void;
  onDuplicate?: (task: TaskData) => void;
  onShare?: (taskId: string) => void;
  expandable?: boolean;
  showActions?: boolean;
  highlightOverdue?: boolean;
  enableQuickEdit?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onAddComment,
  onToggleSubtask,
  onTimeLog,
  onDuplicate,
  onShare,
  expandable = true,
  showActions = true,
  highlightOverdue = true,
  enableQuickEdit = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [timeLogInput, setTimeLogInput] = useState('');
  const [showTimeLogger, setShowTimeLogger] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const commentBoxRef = useRef<HTMLTextAreaElement>(null);
  const deleteConfirmRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showCommentBox && commentBoxRef.current) {
      commentBoxRef.current.focus();
    }
  }, [showCommentBox]);

  useEffect(() => {
    if (showDeleteConfirm && deleteConfirmRef.current) {
      deleteConfirmRef.current.focus();
    }
  }, [showDeleteConfirm]);

  const isOverdue = useCallback((): boolean => {
    if (!task.dueDate || task.status === 'completed' || task.status === 'archived') {
      return false;
    }
    return new Date(task.dueDate) < new Date();
  }, [task.dueDate, task.status]);

  const getDaysRemaining = useCallback((): number => {
    if (!task.dueDate) return Infinity;
    const now = new Date();
    const due = new Date(task.dueDate);
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }, [task.dueDate]);

  const getCompletionPercentage = useCallback((): number => {
    if (task.progress !== undefined) return task.progress;
    if (!task.subtasks || task.subtasks.length === 0) return 0;
    
    const completed = task.subtasks.filter(st => st.completed).length;
    return Math.round((completed / task.subtasks.length) * 100);
  }, [task.progress, task.subtasks]);

  const getTimeEfficiency = useCallback((): 'excellent' | 'good' | 'poor' | 'unknown' => {
    if (!task.estimatedHours || !task.actualHours) return 'unknown';
    const efficiency = task.actualHours / task.estimatedHours;
    
    if (efficiency <= 0.8) return 'excellent';
    if (efficiency <= 1.2) return 'good';
    return 'poor';
  }, [task.estimatedHours, task.actualHours]);

  const handleStatusChange = useCallback((newStatus: TaskData['status']) => {
    if (newStatus === task.status) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      onStatusChange?.(task.id, newStatus);
      setIsAnimating(false);
    }, 300);
  }, [task.id, task.status, onStatusChange]);

  const handleQuickEdit = useCallback(() => {
    if (!enableQuickEdit) return;
    
    if (isEditing) {
      const trimmedTitle = editedTitle.trim();
      const trimmedDescription = editedDescription.trim();
      
      if (trimmedTitle.length < 3 || trimmedTitle.length > 100) {
        alert('Title must be between 3 and 100 characters');
        return;
      }
      
      if (trimmedDescription.length < 10 || trimmedDescription.length > 1000) {
        alert('Description must be between 10 and 1000 characters');
        return;
      }
      
      onEdit?.({
        ...task,
        title: trimmedTitle,
        description: trimmedDescription,
        updatedAt: new Date()
      });
    }
    
    setIsEditing(!isEditing);
  }, [isEditing, editedTitle, editedDescription, task, onEdit, enableQuickEdit]);

  const handleAddComment = useCallback(() => {
    const trimmedComment = commentText.trim();
    if (!trimmedComment) return;
    
    if (trimmedComment.length > 500) {
      alert('Comment must be less than 500 characters');
      return;
    }
    
    onAddComment?.(task.id, trimmedComment);
    setCommentText('');
    setShowCommentBox(false);
  }, [commentText, task.id, onAddComment]);

  const handleTimeLog = useCallback(() => {
    const hours = parseFloat(timeLogInput);
    
    if (isNaN(hours) || hours <= 0) {
      alert('Please enter a valid positive number');
      return;
    }
    
    if (hours > 24) {
      alert('Cannot log more than 24 hours at once');
      return;
    }
    
    onTimeLog?.(task.id, hours);
    setTimeLogInput('');
    setShowTimeLogger(false);
  }, [timeLogInput, task.id, onTimeLog]);

  const handleDelete = useCallback(() => {
    if (deleteConfirmText.toLowerCase() === 'delete') {
      onDelete?.(task.id);
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    } else {
      alert('Please type "delete" to confirm');
    }
  }, [deleteConfirmText, task.id, onDelete]);

  const handleCopyTaskId = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(task.id);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy task ID');
    }
  }, [task.id]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: task.title,
        text: task.description,
        url: window.location.href + '?taskId=' + task.id
      }).catch(err => console.log('Error sharing:', err));
    } else {
      onShare?.(task.id);
    }
  }, [task, onShare]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      action();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setShowCommentBox(false);
      setShowTimeLogger(false);
      setShowDeleteConfirm(false);
    }
  }, []);

  const getPriorityIcon = (priority: TaskData['priority']): string => {
    const icons = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢'
    };
    return icons[priority];
  };

  const getStatusIcon = (status: TaskData['status']): string => {
    const icons = {
      'todo': '📝',
      'in-progress': '⏳',
      'completed': '✅',
      'archived': '📦'
    };
    return icons[status];
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const overdueClass = highlightOverdue && isOverdue() ? 'overdue' : '';
  const daysRemaining = getDaysRemaining();
  const completionPercentage = getCompletionPercentage();
  const timeEfficiency = getTimeEfficiency();

  return (
    <div className={`task-item ${overdueClass} ${isAnimating ? 'animating' : ''}`}>
      <div className="task-header">
        {expandable && (
          <button 
            className="expand-toggle"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        )}
        
        <div className="task-main">
          {isEditing ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onKeyDown={(e) => handleKeyPress(e, handleQuickEdit)}
              className="edit-title"
              maxLength={100}
            />
          ) : (
            <h3 className="task-title">
              {getStatusIcon(task.status)} {task.title}
            </h3>
          )}
          
          <div className="task-meta">
            <span className="priority">
              {getPriorityIcon(task.priority)} {task.priority}
            </span>
            
            {task.assignee && (
              <span className="assignee">👤 {task.assignee}</span>
            )}
            
            {task.dueDate && (
              <span className={`due-date ${daysRemaining < 0 ? 'overdue' : daysRemaining <= 2 ? 'urgent' : ''}`}>
                📅 {new Date(task.dueDate).toLocaleDateString()}
                {daysRemaining >= 0 ? ` (${daysRemaining}d)` : ' (Overdue!)'}
              </span>
            )}
            
            {task.tags.length > 0 && (
              <div className="tags">
                {task.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="tag">#{tag}</span>
                ))}
                {task.tags.length > 3 && (
                  <span className="tag">+{task.tags.length - 3}</span>
                )}
              </div>
            )}
            
            <span className="updated">
              Updated {formatTimeAgo(task.updatedAt)}
            </span>
          </div>
        </div>
        
        {showActions && (
          <div className="task-actions">
            {enableQuickEdit && (
              <button onClick={handleQuickEdit} title="Quick Edit">
                {isEditing ? '💾' : '✏️'}
              </button>
            )}
            
            <button onClick={handleCopyTaskId} title="Copy ID">
              {copySuccess ? '✅' : '📋'}
            </button>
            
            {onShare && (
              <button onClick={handleShare} title="Share">
                🔗
              </button>
            )}
            
            {onDuplicate && (
              <button onClick={() => onDuplicate(task)} title="Duplicate">
                📑
              </button>
            )}
            
            {onDelete && (
              <button onClick={() => setShowDeleteConfirm(true)} title="Delete">
                🗑️
              </button>
            )}
          </div>
        )}
      </div>
      
      {(isExpanded || isEditing) && (
        <div className="task-details">
          {isEditing ? (
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              onKeyDown={(e) => handleKeyPress(e, handleQuickEdit)}
              className="edit-description"
              rows={4}
              maxLength={1000}
            />
          ) : (
            <p className="description">{task.description}</p>
          )}
          
          {completionPercentage > 0 && (
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${completionPercentage}%` }}
              />
              <span className="progress-text">{completionPercentage}% complete</span>
            </div>
          )}
          
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="subtasks">
              <h4>Subtasks ({task.subtasks.filter(st => st.completed).length}/{task.subtasks.length})</h4>
              {task.subtasks
                .sort((a, b) => a.order - b.order)
                .map(subtask => (
                  <div key={subtask.id} className="subtask">
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => onToggleSubtask?.(task.id, subtask.id)}
                    />
                    <span className={subtask.completed ? 'completed' : ''}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
            </div>
          )}
          
          {(task.estimatedHours || task.actualHours) && (
            <div className="time-tracking">
              <span>⏰ Time: {task.actualHours || 0}/{task.estimatedHours || 0}h</span>
              <span className={`efficiency efficiency-${timeEfficiency}`}>
                {timeEfficiency !== 'unknown' && `(${timeEfficiency})`}
              </span>
              {onTimeLog && (
                <button onClick={() => setShowTimeLogger(!showTimeLogger)}>
                  Log Time
                </button>
              )}
            </div>
          )}
          
          {showTimeLogger && (
            <div className="time-logger">
              <input
                type="number"
                value={timeLogInput}
                onChange={(e) => setTimeLogInput(e.target.value)}
                onKeyDown={(e) => handleKeyPress(e, handleTimeLog)}
                placeholder="Hours worked"
                min="0"
                max="24"
                step="0.5"
              />
              <button onClick={handleTimeLog}>Log</button>
              <button onClick={() => setShowTimeLogger(false)}>Cancel</button>
            </div>
          )}
          
          {onStatusChange && (
            <div className="status-changer">
              <span>Change status:</span>
              {(['todo', 'in-progress', 'completed', 'archived'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={task.status === status ? 'active' : ''}
                  disabled={task.status === status}
                >
                  {getStatusIcon(status)} {status}
                </button>
              ))}
            </div>
          )}
          
          {task.comments && task.comments.length > 0 && (
            <div className="comments">
              <h4>Comments ({task.comments.length})</h4>
              {task.comments
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 3)
                .map(comment => (
                  <div key={comment.id} className="comment">
                    <strong>{comment.author}</strong>
                    {comment.edited && <span className="edited">(edited)</span>}
                    <span className="comment-time">{formatTimeAgo(comment.createdAt)}</span>
                    <p>{comment.text}</p>
                  </div>
                ))}
              {task.comments.length > 3 && (
                <button className="show-more">Show {task.comments.length - 3} more comments</button>
              )}
            </div>
          )}
          
          {onAddComment && (
            <div className="add-comment">
              {showCommentBox ? (
                <div className="comment-box">
                  <textarea
                    ref={commentBoxRef}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => handleKeyPress(e, handleAddComment)}
                    placeholder="Add a comment..."
                    rows={3}
                    maxLength={500}
                  />
                  <div className="comment-actions">
                    <span className="char-count">{commentText.length}/500</span>
                    <button onClick={handleAddComment}>Post</button>
                    <button onClick={() => {
                      setShowCommentBox(false);
                      setCommentText('');
                    }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowCommentBox(true)}>
                  💬 Add Comment
                </button>
              )}
            </div>
          )}
          
          {showDeleteConfirm && (
            <div className="delete-confirm">
              <p>⚠️ Type "delete" to confirm deletion:</p>
              <input
                ref={deleteConfirmRef}
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                onKeyDown={(e) => handleKeyPress(e, handleDelete)}
                placeholder="Type 'delete' to confirm"
              />
              <button onClick={handleDelete}>Confirm Delete</button>
              <button onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteConfirmText('');
              }}>Cancel</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
