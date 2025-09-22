# Part A: Build a Task Management REST API

## Your Mission
Build a complete REST API for task management from scratch using Amp.

## Requirements

### API Endpoints
- `GET /tasks` - List all tasks
- `GET /tasks/:id` - Get a specific task
- `POST /tasks` - Create a new task
- `PUT /tasks/:id` - Update a task
- `DELETE /tasks/:id` - Delete a task

### Task Schema
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "status": "pending | in-progress | completed",
  "priority": "low | medium | high",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Technical Requirements
- Use Express.js or Fastify
- Implement proper error handling
- Add input validation
- Include middleware for logging
- Use in-memory storage (bonus: add MongoDB/PostgreSQL)
- Add comprehensive tests
- Include API documentation

## Instructions for Using Amp

1. **Start the conversation:**
   ```
   "Build a REST API for task management with Express.js, including all CRUD operations, validation, error handling, and tests"
   ```

2. **Ask for specific features:**
   ```
   "Add authentication middleware using JWT tokens"
   "Add pagination and filtering to the GET /tasks endpoint"
   "Create a Swagger documentation for the API"
   ```

3. **Use parallel agents:**
   ```
   "Create tests for all endpoints while also adding input validation"
   ```

## Bonus Challenges
- Add user authentication and authorization
- Implement task assignment to users
- Add due dates and reminders
- Create a Docker container for the API
- Add rate limiting and caching

## Expected Files to Create
- `server.js` - Main server file
- `routes/tasks.js` - Task routes
- `middleware/validation.js` - Input validation
- `middleware/errorHandler.js` - Error handling
- `tests/tasks.test.js` - Test suite
- `package.json` - Dependencies
- `.env.example` - Environment variables
- `README.md` - API documentation
