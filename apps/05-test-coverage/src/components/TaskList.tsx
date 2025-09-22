import React, { useState, useMemo, useCallback } from 'react';
import { Task } from '../types/Task';

interface TaskListProps {
  tasks: Task[];
  onUpdateTask?: (id: string, updates: Partial<Task>) => void;
  onDeleteTask?: (id: string) => void;
}

type SortField = 'title' | 'priority' | 'dueDate' | 'status' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onUpdateTask,
  onDeleteTask
}) => {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<Task['status'] | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Task['priority'] | 'all'>('all');
  const [showOverdueTasks, setShowOverdueTasks] = useState(false);
  const maxItemsPerPage = 10;

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  }, [sortField]);

  const toggleTaskSelection = useCallback((taskId: string) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedTasks.size === filteredAndSortedTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredAndSortedTasks.map(t => t.id)));
    }
  }, [selectedTasks.size]);

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks];

    // Search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(lowerSearch) ||
        task.description.toLowerCase().includes(lowerSearch) ||
        task.tags.some(tag => tag.toLowerCase().includes(lowerSearch)) ||
        task.assignee?.toLowerCase().includes(lowerSearch)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }

    // Priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === filterPriority);
    }

    // Overdue filter
    if (showOverdueTasks) {
      const now = new Date();
      filtered = filtered.filter(task => 
        task.dueDate && 
        new Date(task.dueDate) < now && 
        task.status !== 'completed'
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let compareValue = 0;
      
      switch (sortField) {
        case 'title':
          compareValue = a.title.localeCompare(b.title);
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          compareValue = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'dueDate':
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          compareValue = dateA - dateB;
          break;
        case 'status':
          const statusOrder = { pending: 1, 'in-progress': 2, completed: 3, cancelled: 4 };
          compareValue = statusOrder[a.status] - statusOrder[b.status];
          break;
        case 'createdAt':
          compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      
      return sortDirection === 'asc' ? compareValue : -compareValue;
    });

    return filtered;
  }, [tasks, sortField, sortDirection, searchTerm, filterStatus, filterPriority, showOverdueTasks]);

  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * maxItemsPerPage;
    const endIndex = startIndex + maxItemsPerPage;
    return filteredAndSortedTasks.slice(startIndex, endIndex);
  }, [filteredAndSortedTasks, currentPage, maxItemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedTasks.length / maxItemsPerPage);

  const handleBulkAction = useCallback((action: 'delete' | 'complete') => {
    if (selectedTasks.size === 0) return;
    selectedTasks.forEach(id => {
      if (action === 'delete') {
        onDeleteTask?.(id);
      } else if (action === 'complete') {
        onUpdateTask?.(id, { status: 'completed' });
      }
    });
    setSelectedTasks(new Set());
  }, [selectedTasks, onDeleteTask, onUpdateTask]);

  const getTaskUrgency = useCallback((task: Task): 'overdue' | 'urgent' | 'normal' => {
    if (!task.dueDate) return 'normal';
    
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0 && task.status !== 'completed') return 'overdue';
    if (daysUntilDue <= 2 && task.status !== 'completed') return 'urgent';
    return 'normal';
  }, []);

  const getCompletionRate = useCallback((task: Task): number => {
    if (!task.estimatedHours || !task.actualHours) return 0;
    return Math.min(100, (task.actualHours / task.estimatedHours) * 100);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    setSelectedTasks(new Set());
  }, [totalPages]);

  const getPriorityColor = (priority: Task['priority']): string => {
    const colors = {
      high: '#ff8800',
      medium: '#ffcc00',
      low: '#00cc00'
    };
    return colors[priority] || '#999';
  };

  const getStatusBadge = (status: Task['status']): string => {
    const badges = {
      'pending': '📝',
      'in-progress': '🔄',
      'completed': '✅',
      'cancelled': '❌'
    };
    return badges[status] || '📝';
  };

  return (
    <div className="task-list-container">
      <div className="task-list-controls">
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="search-input"
        />
        
        <select 
          value={filterStatus} 
          onChange={(e) => {
            setFilterStatus(e.target.value as Task['status'] | 'all');
            setCurrentPage(1);
          }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        
        <select 
          value={filterPriority} 
          onChange={(e) => {
            setFilterPriority(e.target.value as Task['priority'] | 'all');
            setCurrentPage(1);
          }}
        >
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        
        <label>
          <input
            type="checkbox"
            checked={showOverdueTasks}
            onChange={(e) => {
              setShowOverdueTasks(e.target.checked);
              setCurrentPage(1);
            }}
          />
          Show only overdue
        </label>
      </div>

      {selectedTasks.size > 0 && (
        <div className="bulk-actions">
          <span>{selectedTasks.size} selected</span>
          <button onClick={() => handleBulkAction('complete')}>Mark Complete</button>
          <button onClick={() => handleBulkAction('delete')}>Delete</button>
        </div>
      )}

      <div className="task-list-header">
        <input
          type="checkbox"
          checked={selectedTasks.size === filteredAndSortedTasks.length && filteredAndSortedTasks.length > 0}
          onChange={toggleSelectAll}
        />
        <button onClick={() => handleSort('title')}>
          Title {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
        </button>
        <button onClick={() => handleSort('priority')}>
          Priority {sortField === 'priority' && (sortDirection === 'asc' ? '↑' : '↓')}
        </button>
        <button onClick={() => handleSort('status')}>
          Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
        </button>
        <button onClick={() => handleSort('dueDate')}>
          Due Date {sortField === 'dueDate' && (sortDirection === 'asc' ? '↑' : '↓')}
        </button>
      </div>

      <div className="task-list">
        {paginatedTasks.length === 0 ? (
          <div className="no-tasks">No tasks found matching your criteria</div>
        ) : (
          paginatedTasks.map(task => {
            const urgency = getTaskUrgency(task);
            const completionRate = getCompletionRate(task);
            
            return (
              <div 
                key={task.id} 
                className={`task-item urgency-${urgency}`}
              >
                <input
                  type="checkbox"
                  checked={selectedTasks.has(task.id)}
                  onChange={() => toggleTaskSelection(task.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                
                <div className="task-content">
                  <h3 style={{ color: getPriorityColor(task.priority) }}>
                    {getStatusBadge(task.status)} {task.title}
                  </h3>
                  <p>{task.description}</p>
                  
                  <div className="task-meta">
                    {task.assignee && <span>👤 {task.assignee}</span>}
                    {task.dueDate && (
                      <span className={urgency}>
                        📅 {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="task-actions">
                  {onUpdateTask && task.status !== 'completed' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateTask(task.id, { status: 'completed' });
                      }}
                    >
                      Complete
                    </button>
                  )}
                  {onDeleteTask && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTask(task.id);
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
