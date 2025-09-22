import React, { useMemo } from 'react';
import { Task } from '../types/Task';

interface TaskAnalyticsProps {
  tasks: Task[];
}

export const TaskAnalytics: React.FC<TaskAnalyticsProps> = ({ tasks }) => {
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const cancelled = tasks.filter(t => t.status === 'cancelled').length;
    
    const highPriority = tasks.filter(t => t.priority === 'high').length;
    const mediumPriority = tasks.filter(t => t.priority === 'medium').length;
    const lowPriority = tasks.filter(t => t.priority === 'low').length;
    
    const overdue = tasks.filter(t => {
      if (!t.dueDate || t.status === 'completed') return false;
      return new Date(t.dueDate) < new Date();
    }).length;
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      total,
      completed,
      inProgress,
      pending,
      cancelled,
      highPriority,
      mediumPriority,
      lowPriority,
      overdue,
      completionRate
    };
  }, [tasks]);

  return (
    <div className="task-analytics">
      <h3>📊 Task Analytics</h3>
      
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Tasks</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        
        <div className="stat-card">
          <span className="stat-label">Completion Rate</span>
          <span className="stat-value">{stats.completionRate}%</span>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>
        
        <div className="stat-card">
          <span className="stat-label">Status Breakdown</span>
          <div className="stat-breakdown">
            <div>✅ Completed: {stats.completed}</div>
            <div>🔄 In Progress: {stats.inProgress}</div>
            <div>📝 Pending: {stats.pending}</div>
            <div>❌ Cancelled: {stats.cancelled}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <span className="stat-label">Priority Distribution</span>
          <div className="stat-breakdown">
            <div>🔴 High: {stats.highPriority}</div>
            <div>🟡 Medium: {stats.mediumPriority}</div>
            <div>🟢 Low: {stats.lowPriority}</div>
          </div>
        </div>
        
        {stats.overdue > 0 && (
          <div className="stat-card warning">
            <span className="stat-label">⚠️ Overdue Tasks</span>
            <span className="stat-value">{stats.overdue}</span>
          </div>
        )}
      </div>
    </div>
  );
};
