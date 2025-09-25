# Exercise 02: Broken Todo App 🔧

## Overview
This Todo app has TypeScript errors, failing tests, and missing features. Your challenge is to use Amp to fix all issues and implement the missing functionality.

## Current Issues

### TypeScript Errors (5 errors)
1. **Missing properties in Todo interface** - The Todo interface is missing `completed` and `createdAt` properties
2. **Wrong type for priority** - TodoWithPriority uses `string` instead of a union type
3. **Missing proper type for props** - TodoList uses `any[]` instead of `Todo[]`
4. **Missing return type** - Function in AddTodo.tsx doesn't specify return type
5. **Event type not properly typed** - handleSubmit event parameter is not typed

### Failing Tests (4 tests)
1. **App title test** - Looking for wrong text ("My Todo List" instead of "Todo App")
2. **Add todo test** - Expects timestamp display that doesn't exist
3. **Drag and drop test** - Feature not implemented
4. **Delete todo test** - Uses ambiguous selector `getByText(/delete/i)` causing multiple matches; should target the button (e.g., by role or aria-label)

### Missing Features
- [ ] Drag and drop to reorder todos
- [ ] Export todos to JSON file
- [ ] Import todos from JSON file
- [ ] Offline support with service worker
- [ ] Priority levels (low, medium, high)
- [ ] Due dates for todos
- [ ] Search/filter todos by text
- [ ] Edit todo text inline

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Check TypeScript errors:
```bash
npm run typecheck
```

3. Run tests:
```bash
npm test
```

4. Start the development server:
```bash
npm start
```

## Challenge Instructions

### Step 1: Fix TypeScript Errors
Ask Amp to identify and fix all TypeScript errors in the codebase. The app should pass `npm run typecheck` without errors.

### Step 2: Fix Failing Tests
Have Amp analyze the failing tests and fix them. All tests should pass when running `npm test`.

### Step 3: Implement Missing Features
Choose at least 3 of the missing features and ask Amp to implement them:

1. **Drag and Drop Reordering**
   - Allow users to drag todos to reorder them
   - Persist the order in localStorage

2. **Export/Import JSON**
   - Add buttons to export todos to a JSON file
   - Allow importing todos from a JSON file

3. **Offline Support**
   - Implement a service worker for offline functionality
   - Show offline status indicator

4. **Priority Levels**
   - Add priority selection (low, medium, high)
   - Color code todos by priority

5. **Due Dates**
   - Add date picker for due dates
   - Show overdue todos differently

6. **Search Functionality**
   - Add search bar to filter todos by text
   - Highlight matching text

7. **Inline Editing**
   - Double-click to edit todo text
   - Save on Enter, cancel on Escape

## Success Criteria
- ✅ All TypeScript errors fixed
- ✅ All tests passing
- ✅ At least 3 new features implemented
- ✅ App remains functional throughout

## Tips for Using Amp
- Ask Amp to run `npm run typecheck` to verify TypeScript fixes
- Have Amp run `npm test` to check test status
- Request Amp to implement features one at a time
- Ask Amp to add tests for new features

## Example Prompts
- "Fix all TypeScript errors in this Todo app"
- "Make all tests pass"
- "Add drag and drop functionality to reorder todos"
- "Implement JSON export and import for todos"
- "Add priority levels with color coding"

## Bonus Challenges
- Ask Amp to add animations and transitions
- Have Amp implement keyboard shortcuts
- Request Amp to add data visualization (charts for completed todos)
- Ask Amp to add categories or tags for todos

Good luck! This exercise demonstrates Amp's ability to debug, test, and enhance existing applications. 🚀


npm run typecheck | amp -x 'fix all typecheck issues' 
