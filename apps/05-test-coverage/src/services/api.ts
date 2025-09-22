import axios, { AxiosInstance } from 'axios';
import { Task, User, Dashboard, ApiResponse, PaginatedResponse, FilterOptions } from '../types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async register(email: string, password: string, name: string): Promise<ApiResponse<User>> {
    const response = await this.client.post('/auth/register', { email, password, name });
    return response.data;
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout');
    localStorage.removeItem('token');
  }

  // Task endpoints
  async getTasks(filters?: FilterOptions, page = 1, pageSize = 20): Promise<PaginatedResponse<Task>> {
    const response = await this.client.get('/tasks', {
      params: { ...filters, page, pageSize },
    });
    return response.data;
  }

  async getTask(id: string): Promise<Task> {
    const response = await this.client.get(`/tasks/${id}`);
    return response.data;
  }

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<Task> {
    const response = await this.client.post('/tasks', task);
    return response.data;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const response = await this.client.patch(`/tasks/${id}`, updates);
    return response.data;
  }

  async deleteTask(id: string): Promise<void> {
    await this.client.delete(`/tasks/${id}`);
  }

  async bulkUpdateTasks(ids: string[], updates: Partial<Task>): Promise<Task[]> {
    const response = await this.client.patch('/tasks/bulk', { ids, updates });
    return response.data;
  }

  // Dashboard endpoint
  async getDashboard(): Promise<Dashboard> {
    const response = await this.client.get('/dashboard');
    return response.data;
  }

  // File upload
  async uploadFile(file: File, taskId: string): Promise<{ url: string; id: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('taskId', taskId);

    const response = await this.client.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // User endpoints
  async getUsers(): Promise<User[]> {
    const response = await this.client.get('/users');
    return response.data;
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    const response = await this.client.patch('/users/profile', updates);
    return response.data;
  }

  // WebSocket connection for real-time updates
  connectWebSocket(onUpdate: (data: any) => void): () => void {
    // Implementation would connect to WebSocket server
    // This is a placeholder
    const ws = new WebSocket('ws://localhost:3001');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onUpdate(data);
    };

    return () => ws.close();
  }
}

export const apiService = new ApiService();
