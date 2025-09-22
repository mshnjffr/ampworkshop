// Validation Service - needs comprehensive testing!
import { Task } from '../types/Task';

export const validationService = {
  validateTask(task: Partial<Task>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!task.title?.trim()) {
      errors.push('Title is required');
    } else if (task.title.length > 100) {
      errors.push('Title must be less than 100 characters');
    }

    if (task.description && task.description.length > 1000) {
      errors.push('Description must be less than 1000 characters');
    }

    if (task.priority && !['low', 'medium', 'high'].includes(task.priority)) {
      errors.push('Invalid priority level');
    }

    if (task.status && !['pending', 'in-progress', 'completed', 'cancelled'].includes(task.status)) {
      errors.push('Invalid status');
    }

    if (task.dueDate) {
      const due = new Date(task.dueDate);
      if (isNaN(due.getTime())) {
        errors.push('Invalid due date');
      } else if (due < new Date() && task.status === 'pending') {
        errors.push('Due date cannot be in the past for pending tasks');
      }
    }

    if (task.assignee && task.assignee.length > 50) {
      errors.push('Assignee name too long');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateBulkTasks(tasks: Partial<Task>[]): { valid: Task[]; invalid: Array<{ task: Partial<Task>; errors: string[] }> } {
    const valid: Task[] = [];
    const invalid: Array<{ task: Partial<Task>; errors: string[] }> = [];

    tasks.forEach(task => {
      const validation = this.validateTask(task);
      if (validation.isValid) {
        valid.push(task as Task);
      } else {
        invalid.push({ task, errors: validation.errors });
      }
    });

    return { valid, invalid };
  },

  sanitizeInput(input: string): string {
    // Remove potentially harmful characters
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/[<>]/g, '')
      .trim();
  },

  validateBatchSize(size: number): boolean {
    return size > 0 && size <= 100;
  }
};
