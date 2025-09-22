# Amp Workshop - Agent Configuration

## Commands
- **Setup:** `npm run setup-all` (install all dependencies), `npm run verify` (check environment)
- **Reset:** `npm run reset-all` (reset exercises to initial state)
- **Test:** `npm test` (from each exercise), `npm run test:coverage` (Exercise 05)
- **Run:** `npm start` or `npm run dev` (from each exercise directory)

## Architecture
- **Monorepo:** Workspaces in `apps/` (6 exercises) and `stretch-goals/` (1 parallel task)
- **Stack:** Node.js/Express backend, React frontend (TypeScript preferred)
- **Exercise 03:** Mystery e-commerce API with auth, products, orders, payments modules
- **Exercise 05:** Test coverage challenge with React/TypeScript, target 80%+ coverage

## Code Style
- **TypeScript:** Use for new code, strict mode enabled
- **Imports:** ES6 modules, absolute paths from src/, group by external/internal
- **Naming:** PascalCase (components), camelCase (functions/files), UPPER_SNAKE_CASE (constants)
- **React:** Functional components with hooks, no class components
- **Async:** Use async/await over promises/callbacks
- **Error Handling:** Try-catch blocks, proper error messages, validate inputs
- **Testing:** Files end with `.test.ts`, use Jest/React Testing Library
