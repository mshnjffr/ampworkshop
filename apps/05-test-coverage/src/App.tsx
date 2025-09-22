import React, { useState } from 'react';
import { TaskList } from './components/TaskList';
import { TaskForm } from './components/TaskForm';
import { UserProfile } from './components/UserProfile';
import { TaskAnalytics } from './components/TaskAnalytics';
import { Task } from './types/Task';
import './App.css';

function App() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Write comprehensive tests',
      description: 'Add unit tests for all components',
      priority: 'high',
      status: 'pending',
      assignee: 'Developer',
      createdAt: new Date('2024-01-01'),
      dueDate: new Date('2024-02-01')
    },
    {
      id: '2',
      title: 'Add integration tests',
      description: 'Test component interactions',
      priority: 'medium',
      status: 'in-progress',
      assignee: 'QA Team',
      createdAt: new Date('2024-01-02'),
      dueDate: new Date('2024-02-15')
    }
  ]);

  const handleAddTask = (newTask: Omit<Task, 'id' | 'createdAt'>) => {
    const task: Task = {
      ...newTask,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setTasks([...tasks, task]);
  };

  const handleUpdateTask = (id: string, updates: Partial<Task>) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, ...updates } : task
    ));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>📋 Task Manager</h1>
        <p className="warning-badge">⚠️ 0% Test Coverage - Your Mission: Add Tests!</p>
      </header>

      <div className="app-container">
        <div className="sidebar">
          <UserProfile />
          <TaskAnalytics tasks={tasks} />
        </div>

        <div className="main-content">
          <section className="task-form-section">
            <h2>Create New Task</h2>
            <TaskForm onSubmit={handleAddTask} />
          </section>

          <section className="task-list-section">
            <h2>All Tasks ({tasks.length})</h2>
            <TaskList 
              tasks={tasks}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
            />
          </section>
        </div>
      </div>

      <footer className="app-footer">
        <div className="test-coverage-info">
          <h3>🎯 Testing Challenge</h3>
          <ul>
            <li>Current Coverage: <span className="coverage-bad">0%</span></li>
            <li>Goal: <span className="coverage-good">80%+</span></li>
            <li>Components to test: {Object.keys(components).length}</li>
            <li>Services to test: {Object.keys(services).length}</li>
            <li>Utils to test: {Object.keys(utils).length}</li>
          </ul>
          <p><strong>Use Amp to generate comprehensive tests!</strong></p>
        </div>
      </footer>
    </div>
  );
}

// For the footer stats
const components = {
  TaskList: true,
  TaskForm: true,
  TaskItem: true,
  UserProfile: true,
  TaskAnalytics: true,
  SearchBar: true,
  FilterPanel: true,
  NotificationCenter: true
};

const services = {
  apiService: true,
  authService: true,
  dataService: true,
  validationService: true
};

const utils = {
  dateUtils: true,
  taskUtils: true,
  validationUtils: true,
  formatters: true
};

export default App;
