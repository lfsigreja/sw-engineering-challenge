## Implementation notes

### Stack

- Node.js + TypeScript (ESM)
- Fastify (HTTP layer)
- Zod (request validation)
- Vitest (unit and integration tests)
- ESLint + TypeScript ESLint


### Scripts

- `npm run dev`: start local API in watch mode
- `npm run build`: compile TypeScript to `dist`
- `npm run start`: run compiled server
- `npm run test`: run all tests
- `npm run test:watch`: run tests in watch mode
- `npm run coverage`: run tests with coverage
- `npm run typecheck`: run TypeScript checks
- `npm run lint`: run ESLint


### Quick start

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Run quality checks: `npm run typecheck && npm run lint && npm test`