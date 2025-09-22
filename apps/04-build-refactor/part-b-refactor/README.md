# Part B: Refactor Legacy Code

## Your Mission
Modernize this legacy JavaScript codebase using Amp's refactoring capabilities.

## Current Problems with the Code

### Security Issues
- SQL injection vulnerabilities (string concatenation in queries)
- Passwords stored in plain text
- Hardcoded database credentials
- No input validation

### Code Quality Issues
- Callback hell throughout the codebase
- Using `var` instead of `const`/`let`
- No TypeScript types
- Manual array operations instead of modern methods
- String concatenation instead of template literals
- Using deprecated libraries (request, mysql)

### Architecture Issues
- No proper error handling
- No async/await patterns
- Global variables
- Tight coupling between modules
- No dependency injection

## Refactoring Tasks

### 1. Convert to TypeScript
```
"Convert all JavaScript files to TypeScript with proper types and interfaces"
```

### 2. Modernize Async Code
```
"Replace all callbacks with async/await and Promises"
```

### 3. Fix Security Issues
```
"Fix all SQL injection vulnerabilities and implement proper input validation"
```

### 4. Update Dependencies
```
"Replace deprecated libraries with modern alternatives (mysql2, axios)"
```

### 5. Improve Error Handling
```
"Add comprehensive error handling with custom error classes"
```

### 6. Add Modern Patterns
```
"Replace var with const/let, use template literals, arrow functions, and destructuring"
```

## Using Amp for Parallel Refactoring

### Example 1: Refactor Multiple Files
```
"Refactor all controller files to use async/await instead of callbacks, and add TypeScript types"
```

### Example 2: Security Audit and Fix
```
"Find and fix all security vulnerabilities in the codebase, including SQL injection and password storage"
```

### Example 3: Modernize Everything
```
"Modernize the entire codebase: convert to TypeScript, use async/await, fix security issues, update to ES6+ syntax, and add proper error handling"
```

## Expected Improvements

After refactoring with Amp:
- ✅ TypeScript with full type safety
- ✅ Async/await throughout
- ✅ Parameterized queries (no SQL injection)
- ✅ Password hashing with bcrypt
- ✅ Environment variables for configuration
- ✅ Modern ES6+ syntax
- ✅ Proper error handling
- ✅ Updated dependencies
- ✅ Comprehensive test coverage
- ✅ Clean architecture with dependency injection

## Bonus Challenges
- Add a linter configuration (ESLint + Prettier)
- Implement a repository pattern
- Add request validation middleware
- Create Docker configuration
- Add API documentation with Swagger
- Implement logging with Winston
- Add rate limiting
- Set up CI/CD pipeline

## Files to Refactor
- `index.js` - Main server file with callback routes
- `controllers/taskController.js` - Task logic with SQL injection vulnerabilities
- `controllers/userController.js` - User logic with security issues
- `database/connection.js` - Database with hardcoded credentials
- `utils/helpers.js` - Utility functions using old patterns
- `services/notificationService.js` - Service with callback hell
- `tests/tasks.test.js` - Tests that need updating

## Success Metrics
- No `var` declarations remaining
- No callbacks (except where required by libraries)
- All SQL queries parameterized
- Full TypeScript coverage
- All tests passing
- No security vulnerabilities
