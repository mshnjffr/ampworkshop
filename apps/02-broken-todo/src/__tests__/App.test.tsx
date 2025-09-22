import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import TodoList from '../components/TodoList';
import AddTodo from '../components/AddTodo';

describe('Todo App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // Test 1: FAILING - Incorrect assertion
  test('should render the app title', () => {
    render(<App />);
    // This will fail - looking for wrong text
    const title = screen.getByText(/My Todo List/i);
    expect(title).toBeInTheDocument();
  });

  // Test 2: FAILING - Missing implementation detail
  test('should add a new todo', async () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/what needs to be done/i);
    const addButton = screen.getByText(/add todo/i);

    await userEvent.type(input, 'New todo item');
    fireEvent.click(addButton);

    // This will fail - the todo should also have a timestamp
    const newTodo = screen.getByText('New todo item');
    expect(newTodo).toBeInTheDocument();
    
    // Checking for timestamp that doesn't exist in the UI
    const timestamp = screen.getByText(/created at:/i);
    expect(timestamp).toBeInTheDocument();
  });

  // Test 3: FAILING - Feature not implemented
  test('should support drag and drop reordering', async () => {
    render(<App />);
    
    // Add multiple todos
    const input = screen.getByPlaceholderText(/what needs to be done/i);
    const addButton = screen.getByText(/add todo/i);

    await userEvent.type(input, 'First todo');
    fireEvent.click(addButton);
    
    await userEvent.clear(input);
    await userEvent.type(input, 'Second todo');
    fireEvent.click(addButton);

    // This will fail - drag and drop is not implemented
    const todos = screen.getAllByRole('listitem');
    expect(todos[0]).toHaveAttribute('draggable', 'true');
    
    // Simulate drag and drop (will fail)
    fireEvent.dragStart(todos[0]);
    fireEvent.dragOver(todos[1]);
    fireEvent.drop(todos[1]);
    
    // Check if order changed (it won't)
    const reorderedTodos = screen.getAllByRole('listitem');
    expect(reorderedTodos[0]).toHaveTextContent('Second todo');
  });

  // Test 4: PASSING - Basic functionality
  test('should toggle todo completion', async () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/what needs to be done/i);
    const addButton = screen.getByText(/add todo/i);

    await userEvent.type(input, 'Test todo');
    fireEvent.click(addButton);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(checkbox).toBeChecked();
  });

  // Test 5: PASSING - Delete functionality
  test('should delete a todo', async () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/what needs to be done/i);
    const addButton = screen.getByText(/add todo/i);

    await userEvent.type(input, 'Todo to delete');
    fireEvent.click(addButton);

    const deleteButton = screen.getByText(/delete/i);
    fireEvent.click(deleteButton);

    const deletedTodo = screen.queryByText('Todo to delete');
    expect(deletedTodo).not.toBeInTheDocument();
  });

  // Test 6: PASSING - Filter functionality
  test('should filter todos by status', async () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/what needs to be done/i);
    const addButton = screen.getByText(/add todo/i);

    // Add a todo and mark it complete
    await userEvent.type(input, 'Completed todo');
    fireEvent.click(addButton);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    // Add an active todo
    await userEvent.clear(input);
    await userEvent.type(input, 'Active todo');
    fireEvent.click(addButton);

    // Test completed filter
    const completedFilter = screen.getByText(/Completed \(1\)/);
    fireEvent.click(completedFilter);

    expect(screen.getByText('Completed todo')).toBeInTheDocument();
    expect(screen.queryByText('Active todo')).not.toBeInTheDocument();
  });
});

describe('TodoList Component', () => {
  const mockTodos = [
    { id: 1, text: 'Test todo 1', completed: false, createdAt: '2024-01-01' },
    { id: 2, text: 'Test todo 2', completed: true, createdAt: '2024-01-02' },
  ];

  test('should render todos', () => {
    const mockToggle = jest.fn();
    const mockDelete = jest.fn();
    
    render(
      <TodoList todos={mockTodos} onToggle={mockToggle} onDelete={mockDelete} />
    );

    expect(screen.getByText('Test todo 1')).toBeInTheDocument();
    expect(screen.getByText('Test todo 2')).toBeInTheDocument();
  });

  test('should show empty state when no todos', () => {
    const mockToggle = jest.fn();
    const mockDelete = jest.fn();
    
    render(
      <TodoList todos={[]} onToggle={mockToggle} onDelete={mockDelete} />
    );

    expect(screen.getByText(/no todos yet/i)).toBeInTheDocument();
  });
});
