import React from 'react';
import { Todo } from '../types/Todo';

// TypeScript Error #3: Missing proper type for props
interface TodoListProps {
  todos: any[]; // Should be Todo[]
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

const TodoList: React.FC<TodoListProps> = ({ todos, onToggle, onDelete }) => {
  if (todos.length === 0) {
    return (
      <div className="empty-state">
        <p>No todos yet. Add one above!</p>
      </div>
    );
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggle(todo.id)}
            aria-label={`Mark "${todo.text}" as ${todo.completed ? 'incomplete' : 'complete'}`}
          />
          <span className="todo-text">{todo.text}</span>
          <button
            onClick={() => onDelete(todo.id)}
            className="delete-btn"
            aria-label={`Delete "${todo.text}"`}
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
};

export default TodoList;
