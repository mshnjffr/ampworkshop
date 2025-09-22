// Data Service - needs comprehensive testing!
import { Task } from '../types/Task';

export const dataService = {
  // Local storage operations
  saveToLocal(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
      throw new Error('Storage quota exceeded');
    }
  },

  loadFromLocal<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  clearLocal(key?: string): void {
    if (key) {
      localStorage.removeItem(key);
    } else {
      localStorage.clear();
    }
  },

  // Data transformation
  exportToCSV(tasks: Task[]): string {
    if (tasks.length === 0) return '';
    
    const headers = ['Title', 'Description', 'Status', 'Priority', 'Assignee', 'Due Date'];
    const rows = tasks.map(task => [
      task.title,
      task.description || '',
      task.status,
      task.priority,
      task.assignee || '',
      task.dueDate ? new Date(task.dueDate).toLocaleDateString() : ''
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  },

  exportToJSON(tasks: Task[]): string {
    return JSON.stringify(tasks, null, 2);
  },

  importFromCSV(csvText: string): Task[] {
    const lines = csvText.split('\n');
    if (lines.length < 2) throw new Error('Invalid CSV format');
    
    const tasks: Task[] = [];
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      tasks.push({
        id: Date.now().toString() + i,
        title: values[0] || 'Untitled',
        description: values[1],
        status: values[2] as Task['status'] || 'pending',
        priority: values[3] as Task['priority'] || 'medium',
        assignee: values[4],
        dueDate: values[5] ? new Date(values[5]) : undefined,
        createdAt: new Date()
      });
    }
    
    return tasks;
  }
};
