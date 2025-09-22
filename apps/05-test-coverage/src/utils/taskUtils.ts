// Task Utilities - needs comprehensive testing!
import { Task } from '../types/Task';

export const sortTasks = (tasks: Task[], sortBy: 'priority' | 'dueDate' | 'status' | 'title'): Task[] => {
  const sorted = [...tasks];
  
  switch (sortBy) {
    case 'priority':
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    case 'dueDate':
      return sorted.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    
    case 'status':
      const statusOrder = { 'pending': 0, 'in-progress': 1, 'completed': 2, 'cancelled': 3 };
      return sorted.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
    
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    
    default:
      return sorted;
  }
};

export const filterTasks = (
  tasks: Task[],
  filters: {
    status?: Task['status'];
    priority?: Task['priority'];
    assignee?: string;
    search?: string;
  }
): Task[] => {
  return tasks.filter(task => {
    if (filters.status && task.status !== filters.status) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.assignee && task.assignee !== filters.assignee) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesTitle = task.title.toLowerCase().includes(searchLower);
      const matchesDescription = task.description?.toLowerCase().includes(searchLower);
      if (!matchesTitle && !matchesDescription) return false;
    }
    return true;
  });
};

export const getTaskStats = (tasks: Task[]): {
  total: number;
  byStatus: Record<Task['status'], number>;
  byPriority: Record<Task['priority'], number>;
  overdue: number;
  completionRate: number;
} => {
  const stats = {
    total: tasks.length,
    byStatus: {
      'pending': 0,
      'in-progress': 0,
      'completed': 0,
      'cancelled': 0
    },
    byPriority: {
      'low': 0,
      'medium': 0,
      'high': 0
    },
    overdue: 0,
    completionRate: 0
  };

  tasks.forEach(task => {
    stats.byStatus[task.status]++;
    stats.byPriority[task.priority]++;
    
    if (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed') {
      stats.overdue++;
    }
  });

  if (stats.total > 0) {
    stats.completionRate = Math.round((stats.byStatus.completed / stats.total) * 100);
  }

  return stats;
};

export const groupTasksByAssignee = (tasks: Task[]): Record<string, Task[]> => {
  const grouped: Record<string, Task[]> = { 'Unassigned': [] };
  
  tasks.forEach(task => {
    const key = task.assignee || 'Unassigned';
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(task);
  });
  
  return grouped;
};
