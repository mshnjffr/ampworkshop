// TypeScript Error #1: Missing properties in interface
export interface Todo {
  id: number;
  text: string;
  // Missing properties: completed, createdAt
}

// TypeScript Error #2: Wrong type for priority
export interface TodoWithPriority extends Todo {
  priority: string; // Should be a union type: 'low' | 'medium' | 'high'
}

export interface TodoFilter {
  showCompleted: boolean;
  searchTerm: string;
  sortBy?: 'date' | 'priority' | 'alphabetical';
}
