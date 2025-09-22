export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: string;
  lastLogin?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'in-progress' | 'review' | 'done';
  deadline?: string;
  assignees?: string[];
  tags?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  filename: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface Dashboard {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  upcomingDeadlines: Task[];
  tasksByStatus: Record<Task['status'], number>;
  tasksByPriority: Record<Task['priority'], number>;
  recentActivity: Activity[];
}

export interface Activity {
  id: string;
  type: 'task_created' | 'task_updated' | 'task_completed' | 'comment_added';
  taskId: string;
  userId: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface FilterOptions {
  status?: Task['status'][];
  priority?: Task['priority'][];
  assignees?: string[];
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}
