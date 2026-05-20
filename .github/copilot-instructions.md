# OctoCAT Supply Chain Management Application – General Copilot Instructions

These are repository-wide guidelines. Path‑scoped files in `.github/instructions/*.instructions.md` provide focused guidance for specific areas (frontend, API, database).

## High-Level Architecture

TypeScript monorepo with:
- `api/` Express REST API (SQLite persistence, repository pattern, Swagger docs)
- `frontend/` React + Vite + Tailwind UI
- Shared demo + infra docs under `docs/` and deployment scripts under `infra/`

Refer to [docs/architecture.md](docs/architecture.md) and [docs/sqlite-integration.md](docs/sqlite-integration.md) for deeper details. Avoid restating them in reviews and link instead.

## Quick Start Commands

```bash
# Root-level (orchestration via Makefile)
make install          # Install all dependencies (both API and frontend)
make dev             # Start both API (port 3000) and frontend (port 5137) concurrently
make build           # Build both projects for production

# API commands (from api/ directory)
npm run dev          # Start with hot reload + auto seed
npm run build        # Compile TypeScript to dist/
npm run start        # Production: seed + node dist/index.js
npm test             # Run Vitest tests
npm run test:coverage # Generate coverage report
npm run db:init      # Initialize database
npm run db:seed      # Initialize + seed data

# Frontend commands (from frontend/ directory)
npm run dev          # Start Vite dev server (port 5137)
npm run build        # TypeScript check + Vite build
npm run test:e2e     # Run Playwright E2E tests
```

## Core Technologies

- **Backend**: TypeScript, Node.js, Express.js, better-sqlite3, Vitest
- **Frontend**: TypeScript, React 18, React Query, React Router DOM, Vite, Tailwind CSS, Playwright
- **Database**: SQLite (file-based in production, `:memory:` for tests)
- **Documentation**: Swagger/OpenAPI (accessible at `/api-docs`)

## Naming Conventions

Follow these conventions consistently across the codebase:

### TypeScript/JavaScript
- **Files**: kebab-case (`suppliersRepo.ts`, `order-detail.ts`)
- **Classes**: PascalCase (`SuppliersRepository`, `DatabaseConnection`)
- **Interfaces/Types**: PascalCase (`Supplier`, `Product`, `User`)
- **Functions/Methods**: camelCase (`findAll`, `createSupplier`, `handleSubmit`)
- **Variables**: camelCase (`dbConnection`, `supplierData`, `userId`)
- **Constants**: UPPER_SNAKE_CASE for true constants (`DB_FILE`, `API_BASE_URL`)
- **React Components**: PascalCase file and component name (`Products.tsx` exports `Products`)

### SQL
- **Tables**: snake_case plural (`suppliers`, `order_details`, `products`)
- **Columns**: snake_case (`supplier_id`, `contact_person`, `created_at`)
- **Primary Keys**: `{table_singular}_id` pattern (`supplier_id`, `product_id`)
- **Foreign Keys**: Match referenced table's PK name (`supplier_id` references `suppliers.supplier_id`)

### Critical Pattern: Case Mapping
- **Database columns**: snake_case (SQL convention)
- **TypeScript properties**: camelCase (JavaScript convention)
- **Conversion utilities**: Use `objectToCamelCase()`, `buildInsertSQL()`, `buildUpdateSQL()` from `api/src/utils/sql.ts`
- **Never**: Manually write field mappings; always use utilities

## TypeScript Best Practices

### Type Safety
- **Enable strict mode**: `tsconfig.json` has `"strict": true` enabled — maintain this
- **Avoid `any`**: Use specific types, generics, or `unknown` when type is truly dynamic
  ```typescript
  // Bad
  function process(data: any) { }
  
  // Good
  function process<T extends { id: number }>(data: T) { }
  
  // For truly unknown types
  function process(data: unknown) {
    if (typeof data === 'string') { /* narrowed to string */ }
  }
  ```
- **Use type inference**: Don't redundantly annotate when TypeScript can infer
  ```typescript
  // Bad (redundant)
  const name: string = 'John';
  
  // Good (inference)
  const name = 'John';
  ```
- **Explicit parameter types**: Always type function parameters and public API return types
  ```typescript
  // Good
  function processUser(user: User): string {
    return user.name.toUpperCase();
  }
  ```

### Interfaces vs. Types
- **Use `interface`** for object shapes that can be extended
  ```typescript
  interface User {
    id: number;
    name: string;
  }
  
  interface AdminUser extends User {
    permissions: string[];
  }
  ```
- **Use `type`** for unions, tuples, or mapped types
  ```typescript
  type UserRole = 'admin' | 'editor' | 'viewer';
  type UserId = number | string;
  type ReadonlyUser = Readonly<User>;
  ```

### Null/Undefined Handling
- **Use optional chaining** (`?.`) and nullish coalescing (`??`)
  ```typescript
  // Good
  const name = user?.profile?.name ?? 'Anonymous';
  const count = items?.length ?? 0;
  ```
- **Check for null/undefined** explicitly before use
  ```typescript
  function getLength(str: string | null): number {
    if (str === null) return 0;
    return str.length;
  }
  ```

### Async/Await Patterns
- **Always handle errors** in async functions
  ```typescript
  // Good
  async function fetchData<T>(url: string): Promise<T> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json() as T;
    } catch (error) {
      console.error('Fetch failed:', error);
      throw error; // Re-throw for caller to handle
    }
  }
  ```
- **Use `Promise.all`** for parallel operations
  ```typescript
  // Good - parallel
  const [users, products] = await Promise.all([
    fetchUsers(),
    fetchProducts()
  ]);
  
  // Bad - sequential (slower)
  const users = await fetchUsers();
  const products = await fetchProducts();
  ```
- **Flatten async/await**: Avoid callback hell
  ```typescript
  // Bad - nested
  const user = await getUser(id);
  if (user) {
    const orders = await getOrders(user.id);
    if (orders.length > 0) { /* ... */ }
  }
  
  // Good - flattened with early returns
  const user = await getUser(id);
  if (!user) return null;
  
  const orders = await getOrders(user.id);
  if (orders.length === 0) return { user, orders: [] };
  ```

### Type-Only Imports
- **Use `import type`** for types to improve tree-shaking
  ```typescript
  // Good
  import type { User, Product } from './types';
  import { fetchUser } from './api';
  ```

### File Organization
- **Module structure**: Group related files by feature/entity
  ```
  models/supplier.ts      # Type definitions
  repositories/suppliersRepo.ts  # Data access
  routes/supplier.ts      # HTTP handlers
  ```
- **Barrel exports**: Use `index.ts` for clean imports
  ```typescript
  // user/index.ts
  export * from './user.model';
  export * from './user.service';
  ```

## Code Patterns and Architecture

### Repository Pattern

**Standard Structure** (see existing repositories as examples):
```typescript
export class EntityRepository {
  private db: DatabaseConnection;
  
  constructor(db: DatabaseConnection) {
    this.db = db;
  }
  
  async findAll(): Promise<Entity[]> { /* ... */ }
  async findById(id: number): Promise<Entity | null> { /* ... */ }
  async create(entity: Omit<Entity, 'entityId'>): Promise<Entity> { /* ... */ }
  async update(id: number, partial: Partial<Omit<Entity, 'entityId'>>): Promise<Entity> { /* ... */ }
  async delete(id: number): Promise<void> { /* ... */ }
  async exists(id: number): Promise<boolean> { /* ... */ }
}

// Factory for test/prod instances
export async function getEntityRepository(isTest = false): Promise<EntityRepository>
```

**Key Principles**:
- Methods are `async` and return `Promise<T>`
- `Omit<Entity, 'id'>` for create (DB generates ID)
- `Partial<Omit<Entity, 'id'>>` for update (allow partial updates)
- Use `handleDatabaseError()` utility for consistent error handling
- Singleton pattern for production, fresh instances for tests

### Error Handling

**Custom Error Hierarchy** (defined in `api/src/utils/errors.ts`):
```
DatabaseError (500)
├── NotFoundError (404)      // Entity not found
├── ValidationError (400)     // Invalid input/foreign key
└── ConflictError (409)       // UNIQUE constraint violation
```

**Usage Pattern**:
```typescript
// In repository
import { handleDatabaseError } from '../utils/errors';

try {
  const result = await this.db.run(sql, params);
} catch (error) {
  throw handleDatabaseError(error, 'Supplier', id);
}

// In route
router.get('/:id', async (req, res, next) => {
  try {
    const repo = await getRepository();
    const item = await repo.findById(parseInt(req.params.id));
    if (item) res.json(item);
    else res.status(404).send('Not found');
  } catch (error) {
    next(error); // errorHandler middleware converts to HTTP response
  }
});
```

### API Route Pattern

**Standard Structure**:
```typescript
/**
 * @swagger
 * /api/entities:
 *   get:
 *     summary: Returns all entities
 *     tags: [Entities]
 *     responses:
 *       200:
 *         description: List of entities
 */
import express from 'express';
import { getEntityRepository } from '../repositories/entityRepo';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const repo = await getEntityRepository();
    const data = await repo.findAll();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
```

**Requirements**:
- Swagger JSDoc comments above every route
- Thin handlers: validation + repository call
- Async/await with try/catch → `next(error)`
- Appropriate HTTP status codes (200, 201, 204, 400, 404, 500)

### Database Migrations

**Rules**:
- **Never edit existing migrations** — they are append-only
- Create new migration file with incremental number (`003_add_column.sql`)
- Update TypeScript models to match new schema
- Adjust repositories if column mappings change
- Test migrations with `npm run db:init` (API)

**Pattern**:
```sql
-- database/migrations/003_add_status_column.sql
ALTER TABLE suppliers ADD COLUMN status TEXT DEFAULT 'active';
```

### Testing Patterns

**Repository Unit Tests** (Vitest with mocks):
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../db/sqlite');

describe('EntityRepository', () => {
  let repository: EntityRepository;
  let mockDb: any;
  
  beforeEach(() => {
    mockDb = {
      run: vi.fn(),
      get: vi.fn(),
      all: vi.fn(),
    };
    repository = new EntityRepository(mockDb);
    vi.clearAllMocks();
  });

  it('should return all entities', async () => {
    mockDb.all.mockResolvedValue([{ entity_id: 1, name: 'Test' }]);
    const result = await repository.findAll();
    expect(result).toHaveLength(1);
  });
});
```

**Route Integration Tests**:
```typescript
import request from 'supertest';
import express from 'express';

describe('Entity API', () => {
  beforeEach(async () => {
    await closeDatabase();
    await getDatabase(true);  // In-memory DB
    await runMigrations(true);
    // Seed required foreign keys
  });

  it('should create entity', async () => {
    const response = await request(app)
      .post('/api/entities')
      .send(newEntity);
    expect(response.status).toBe(201);
  });
});
```

**Test Execution**:
- Run `npm test` from `api/` for watch mode
- Use in-memory database (`:memory:`) for speed and isolation
- Always call `closeDatabase()` before `getDatabase(true)` to avoid state leakage

## React/Frontend Best Practices

### Component Structure
- **Organize by feature**: `components/entity/EntityName/`
- **Keep components focused**: Single responsibility
- **Use TypeScript interfaces** for props and API responses
- **Handle loading and error states** explicitly

### State Management
- **React Query** for server state (data fetching, caching, refetching)
- **React Context** for app state (theme, auth) — use sparingly
- **Local state** (`useState`) for component-specific UI state
- **Avoid prop drilling**: Use context when passing props through 3+ levels

### Styling
- **Prefer Tailwind utilities** over custom CSS
- **Avoid dynamic class names**: Tailwind purges unused classes
  ```tsx
  // Good
  className={isDark ? 'bg-gray-900' : 'bg-gray-100'}
  
  // Bad (may be purged)
  className={`bg-${color}-500`}
  ```
- **Use Tailwind's responsive modifiers**: `md:`, `lg:`, etc.

### Data Fetching
```typescript
import { useQuery } from 'react-query';
import axios from 'axios';

function Products() {
  const { data, isLoading, error } = useQuery('products', async () => {
    const response = await axios.get<Product[]>('/api/products');
    return response.data;
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading products</div>;
  
  return <div>{/* render products */}</div>;
}
```

## SQL Best Practices

### Query Construction
- **Use parameterized queries**: Prevent SQL injection
  ```typescript
  // Good
  const sql = 'SELECT * FROM suppliers WHERE supplier_id = ?';
  const result = await db.get(sql, [supplierId]);
  
  // Bad - SQL injection risk
  const sql = `SELECT * FROM suppliers WHERE supplier_id = ${supplierId}`;
  ```
- **Use utility functions**: `buildInsertSQL()`, `buildUpdateSQL()` for automatic parameter binding

### Foreign Keys
- SQLite requires explicit enablement: `PRAGMA foreign_keys = ON` (done in `db/config.ts`)
- Respect foreign key constraints in seeds: insert parents before children
- Define cascades in schema (`ON DELETE CASCADE`)

### Boolean Fields
- SQLite stores booleans as `0`/`1` integers
- Convert in repositories: `active: Boolean(row.active)`
- Use utility: `convertBooleanFields(row, ['active', 'enabled'])`

## Common Pitfalls and Gotchas

### Backend
1. **Case Mismatch**: SQL is snake_case, TypeScript is camelCase — always use conversion utilities
2. **Foreign Key Order**: Seeds must insert in dependency order (parents first)
3. **Test Isolation**: Call `closeDatabase()` before `getDatabase(true)` to avoid state leakage
4. **Boolean Conversion**: SQLite returns 0/1, not true/false — convert explicitly
5. **Repository Singleton**: Use `isTest=true` in tests to get fresh instances

### Frontend
1. **API URL Detection**: Check console logs to verify correct API_BASE_URL is used
2. **React Query Cache**: Old data may show until refetch — configure `staleTime` appropriately
3. **Tailwind Purging**: Dynamic class names may be removed — use safelist or complete class names
4. **Context Re-renders**: Overusing context causes unnecessary re-renders — prefer prop passing

## General Review Guidance

When generating suggestions:
1. **Prefer incremental, minimal diffs**: Preserve existing style and naming
2. **Prioritize security and correctness**: Surface data integrity issues before micro-optimizations
3. **Encourage type safety**: No `any` unless justified; suggest adding/refining types
4. **Flag duplicate logic**: Suggest shared utilities or repository methods
5. **Use custom error types**: NotFound, Validation, Conflict with proper HTTP status codes
6. **Request tests**: Unit tests for repositories, component/integration tests for critical paths
7. **Highlight performance issues**: N+1 queries, unnecessary data loading, large bundle additions
8. **Prefer environment variables**: Avoid hard-coded paths/secrets

## Workflow for Adding New Features

### Adding a New Entity
1. **Database**: Create migration `database/migrations/00X_add_entity.sql`
2. **Model**: Create `api/src/models/entity.ts` with TypeScript interface + Swagger docs
3. **Repository**: Create `api/src/repositories/entityRepo.ts` following repository pattern
4. **Route**: Create `api/src/routes/entity.ts` with Express handlers + Swagger docs
5. **Mount**: Add `app.use('/api/entities', entityRoutes)` in `api/src/index.ts`
6. **Test**: Create `entityRepo.test.ts` (unit) and `entity.test.ts` (integration)
7. **Seed** (optional): Add `database/seed/00X_entities.sql`

### Modifying Schema
1. Create new migration (never edit existing)
2. Update model interfaces
3. Adjust repository if mappings change
4. Update tests
5. Run `npm run db:init` to verify

### Adding Frontend Feature
1. Create component following structure: `components/entity/EntityName/`
2. Use React Query for data fetching
3. Type API response with interface
4. Handle loading/error states
5. Use Tailwind for styling
6. Add E2E test if user-facing

## Monorepo Workflow

- **Build**: `make build` (root) or `npm run build` (in api/ or frontend/)
- **Test**: Run tests from respective directories
- **PRs**: Keep scoped — code + tests + docs when behavior changes
- **New subsystems**: Create new `.instructions.md` with `applyTo` globs

## Code Review Principles

1. **Security / data integrity** (highest priority)
2. **Logical / functional correctness**
3. **Performance / scalability**
4. **Maintainability / duplication**
5. **Readability / consistency**
6. **Style / minor formatting** (lowest priority)

## Documentation

- **Link, don't duplicate**: Reference existing docs in `docs/` folder
- **Keep Swagger updated**: Add JSDoc comments for all API routes
- **Update this file**: If new patterns emerge or conventions change

---

**For detailed subsystem guidance**: See `.github/instructions/api.instructions.md`, `frontend.instructions.md`, and `database.instructions.md`.

If new subsystems are added (e.g., `mobile/`, `worker/`), create a new `*.instructions.md` with `applyTo` globs instead of bloating this file.
