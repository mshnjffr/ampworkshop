# 🎯 Exercise 05: Test Coverage Challenge

## The Challenge
You have a working Task Manager application with **0% test coverage**. Your mission: Use Amp to generate comprehensive tests and achieve 80%+ coverage!

## Current State
- ✅ Fully functional React + TypeScript app
- ❌ 0% test coverage (despite 55 passing placeholder tests!)
- 📝 Test files exist but only contain `expect(true).toBe(true)` placeholders

## Your Mission
Transform this codebase from 0% to 80%+ test coverage using Amp's test generation capabilities.

## Success Criteria (15-20 minutes)
- [ ] Unit tests for all 4 utility modules
- [ ] Component tests for all 7 React components (render + interactions)
- [ ] Service tests for apiService and authService with mocking
- [ ] Achieve 80%+ line coverage for src/**
- [ ] All tests passing

## What You'll Learn
- How to use Amp to generate comprehensive test suites
- Best practices for testing React components
- Mocking strategies for services and APIs
- How to identify and test edge cases
- Test-driven refactoring with Amp

## Quick Start

1. **Check current coverage (0%)**:
   ```bash
   npm test          # Shows 55 tests passing
   npm run test:coverage  # Shows 0% coverage
   ```

2. **Use Amp to generate real tests** - Example prompts:
   ```
   "Generate React Testing Library tests for TaskList covering filtering, sorting, pagination, and empty state"
   
   "Create jest tests for validationUtils covering valid & invalid emails, priorities, and password rules"
   
   "Mock axios in apiService tests and assert correct HTTP verbs & URLs"
   
   "Replace all TODO tests in dateUtils.test.ts with comprehensive test implementations"
   ```

3. **Run tests and check coverage improvement**:
   ```bash
   npm test
   npm run test:coverage
   ```

## Files to Test

### Components (src/components/)
- `TaskList.tsx` - Main task list with filtering, sorting, pagination
- `TaskForm.tsx` - Form with validation
- `UserProfile.tsx` - User display component  
- `TaskAnalytics.tsx` - Statistics and charts

### Services (src/services/)
- `apiService.ts` - REST API calls (mock fetch)
- `authService.ts` - Authentication logic (mock localStorage)
- `dataService.ts` - Local storage & data operations
- `validationService.ts` - Validation logic

### Utilities (src/utils/)
- `dateUtils.ts` - Date formatting and calculations
- `validationUtils.ts` - Input validation helpers
- `taskUtils.ts` - Task-specific utilities
- `formatters.ts` - Text and number formatting

## Amp Prompt Cheatsheet

### For Components:
```
"Generate tests for [Component] that cover:
- Component renders correctly with default props
- User interactions (clicks, form inputs)
- Conditional rendering based on props/state
- Error states and loading states
- Accessibility attributes"
```

### For Services:
```
"Create tests for [Service] including:
- Mock all external dependencies (fetch, localStorage)
- Test success and error cases
- Verify correct parameters are passed
- Test error handling and retries"
```

### For Utilities:
```
"Write tests for [Utility] covering:
- Valid inputs with expected outputs
- Invalid/edge case inputs
- Null/undefined handling
- Boundary conditions"
```

## Tips for Success
1. **Start with utilities** - they're pure functions and easiest to test
2. **Let Amp see the TODO tests** - they provide hints about what to test
3. **Use existing test setup** - Jest and React Testing Library are already configured
4. **Focus on critical paths first** - get the main functionality covered before edge cases
5. **Use the coverage report** - it highlights untested lines and branches

## Expected Timeline  
- **3-5 min**: Test all utilities to 100% coverage
- **5-8 min**: Test key components with user interactions  
- **3-5 min**: Add service tests with mocking
- **2-3 min**: Fill coverage gaps identified in report
- **Total: 13-21 minutes to reach 80%+ coverage**

## Sample Test Fixtures

When testing, you can use these sample data structures:

```typescript
const mockTask = {
  id: '1',
  title: 'Test Task',
  description: 'Test description',
  status: 'pending',
  priority: 'medium',
  assignee: 'John Doe',
  dueDate: new Date('2024-12-31'),
  createdAt: new Date()
};

const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin'
};
```

## The Power of Amp
Let Amp handle the tedious test writing while you focus on identifying what needs testing! Watch your coverage go from 0% to 80%+ in under 20 minutes! 🚀
