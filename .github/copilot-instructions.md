# OctoCAT Supply Chain Management Application – General Copilot Instructions

Repository-wide guidelines. Path-scoped files in `.github/instructions/` provide focused guidance per area (frontend, API, database). Read [docs/architecture.md](../docs/architecture.md) and [docs/sqlite-integration.md](../docs/sqlite-integration.md) for deep architecture context; do not restate them here — link instead.

---

## High-Level Architecture

TypeScript monorepo:
- `api/` – Express REST API, SQLite persistence (`better-sqlite3`), repository pattern, Swagger/OpenAPI docs at `/api-docs`
- `frontend/` – React 18 + Vite + Tailwind CSS + React Query + React Router v7
- `database/` – SQL migrations (`database/migrations/`) and seed data (`database/seed/`)
- `docs/` – Architecture, build, and integration references
- `infra/` – Bicep/Container Apps deployment

Data flow: `frontend` ↔ `api` (`:3000`) ↔ `SQLite` (`data/app.db`)  
Naming bridge: TypeScript uses **camelCase**, SQL columns use **snake_case** — `objectToCamelCase()` in `api/src/utils/sql.ts` handles this mapping automatically.

---

## Quick-Start Commands

Always verify a change builds and tests pass before submitting.

| Task | Command |
|------|---------|
| Install all deps | `make install` |
| Dev (both) | `make dev` |
| Build (both) | `make build` |
| Build API only | `make build-api` |
| Build frontend only | `make build-frontend` |
| API unit tests | `cd api && npm test` |
| API test coverage | `cd api && npm run test:coverage` |
| API lint | `cd api && npm run lint` |
| API lint fix | `cd api && npm run lint:fix` |
| Frontend e2e tests | `cd frontend && npm run test:e2e` |
| Frontend lint | `cd frontend && npm run lint` |
| DB init (migrations + seed) | `make db-init` |
| DB migrations only | `make db-migrate` |

Build output: `api/dist/` (CommonJS). Frontend dev server on port **5137**, API on port **3000**.

---

## TypeScript Best Practices

Both `api/` and `frontend/` have `"strict": true` in `tsconfig.json`. All code must comply.

### Type System
- **No `any`** – use `unknown` for untyped boundaries and narrow with type guards; use generics for reusable logic.
- **Prefer `interface` for object shapes** that will be extended or implemented; use `type` for unions, tuples, and mapped types.
  ```ts
  // ✅ interface for domain models
  interface Supplier { supplierId: number; name: string; active: boolean; }
  // ✅ type for unions
  type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  ```
- **Let TypeScript infer** when the type is obvious from assignment; annotate public API boundaries explicitly.
- **Use type guards** to safely narrow `string | number` or `unknown` inputs.
- **Handle `null` and `undefined` explicitly** — use optional chaining (`?.`) and nullish coalescing (`?? 0`) instead of `!` assertions.
- **Use `as const`** for literal arrays/objects to get narrow types and extract union types.
- **Type-only imports** for types not needed at runtime: `import type { Supplier } from '../models/supplier'`.

### Functions & Async
- Annotate public function parameters and return types; let inference handle private/local functions.
- Use `async/await`; flatten nested chains with early returns. Use `Promise.all()` for independent parallel operations.
- Always handle async errors with `try/catch` and re-throw or convert to domain errors.
- Keep functions single-responsibility — validation, transformation, and persistence are separate concerns.

### Project Conventions
- **Models** live in `api/src/models/` — plain `interface` declarations with a companion Swagger JSDoc `@swagger` schema above the interface.
- **Repositories** in `api/src/repositories/` — class with `DatabaseConnection` injected via constructor; expose `create*Repository()` factory + `get*Repository()` singleton.
- **Routes** in `api/src/routes/` — thin handlers: call repo, return JSON, pass errors to `next(error)`.
- **Errors** use `api/src/utils/errors.ts` custom classes: `NotFoundError`, `ValidationError`, `ConflictError`, `DatabaseError`. Never throw raw `Error` from a repo.
- **SQL utilities** via `api/src/utils/sql.ts`: `buildInsertSQL()`, `buildUpdateSQL()`, `objectToCamelCase()`, `SelectQueryBuilder`.

### tsconfig Highlights
| Setting | API | Frontend |
|---------|-----|----------|
| `target` | ES6 | ES2020 |
| `module` | commonjs | ESNext |
| `strict` | ✅ | ✅ |
| `noUnusedLocals` | — | ✅ |
| `noUnusedParameters` | — | ✅ |

---

## SQL / SQLite Best Practices

See [docs/sqlite-integration.md](../docs/sqlite-integration.md) for the full guide.

- **Always use parameterized queries** — never interpolate user input into SQL strings.
- **Foreign keys are enforced** — `PRAGMA foreign_keys = ON` is set on every connection via `api/src/db/sqlite.ts`.
- **WAL mode is enabled** for better concurrency — do not disable it.
- **Migrations are immutable** — never edit an existing `database/migrations/*.sql` file; add a new numbered file (`003_…sql`).
- **Seed files are ordered** — `001_suppliers` → `002_headquarters` → `003_branches` → `004_products` to respect FK dependencies; use explicit PKs for deterministic references.
- **Boolean columns** are `INTEGER` (0/1) in SQLite; `convertBooleanFields()` in each repo converts them to JS `boolean`.
- **Indexes** — add indexes on every FK column and high-selectivity filter column in the same migration that creates the table/column.
- **Transactions** — wrap multi-table writes that must succeed or fail together in a transaction.
- **CHECK constraints** for domain invariants (e.g., `quantity >= 0`, `price > 0`).
- Test with `:memory:` databases (`TEST_DB_CONFIG` in `api/src/db/config.ts`) — never use the dev `app.db` in tests.

---

## React / JSX Best Practices

See [.github/instructions/frontend.instructions.md](instructions/frontend.instructions.md) for the full frontend checklist.

- **Data fetching via React Query** (`useQuery`, `useMutation`) — not raw `useEffect` + `axios`. React Query handles caching, loading, and error states.
- **API base URL** comes from `frontend/src/api/config.ts` (`api.baseURL + api.endpoints.*`) — supports runtime config, GitHub Codespaces, and localhost fallback automatically.
- **Tailwind utilities preferred** over custom CSS; use `darkMode: 'class'` — check `darkMode` from `useTheme()` and apply `dark:` variants or conditional class strings.
- **Small, focused components** — keep files under ~150 LOC; split into presentation and container components.
- **State management hierarchy**: React Query for server state → `useState`/`useReducer` for local UI state → Context (`AuthContext`, `ThemeContext`) only for truly global state. Avoid overusing context.
- **Accessibility first** — semantic HTML elements, `<label>` + `htmlFor` for all inputs, keyboard navigation, visible focus rings.
- **TypeScript interfaces for API response types** — never type axios responses as `any`; define shapes in `frontend/src/api/` or `models/`.
- **Lazy-load heavy routes** with `React.lazy` + `Suspense` to keep initial bundle small.
- **No `dangerouslySetInnerHTML`** with untrusted content.
- **Responsive by default** — test at mobile (≤640px), md, and lg breakpoints using Tailwind responsive prefixes.

---

## General Review Guidance

1. Prefer incremental, minimal diffs; preserve existing style and naming.
2. Surface **security and data integrity** issues first — SQL injection, missing FK enforcement, leaked stack traces, CORS misconfiguration.
3. **No `any`** unless a justified comment explains why. Suggest narrower types or generics.
4. Flag duplicate logic that belongs in a shared utility or repository method.
5. Error handling must use `api/src/utils/errors.ts` custom types and propagate via Express `next(error)` → `errorHandler` middleware.
6. Encourage tests: unit tests for new repository methods (Vitest + in-memory DB) and integration tests for new routes (supertest).
7. Flag N+1 query patterns — prefer a single JOIN over per-row SELECT loops.
8. All configuration via environment variables; no hard-coded paths or secrets.

---

## Escalation Order for Suggestions

1. Security / data integrity
2. Logical / functional correctness
3. Performance / scalability
4. Maintainability / duplication
5. Readability / consistency
6. Style / minor formatting

---

## Monorepo Workflow

- Build before committing: `make build` (or workspace-scoped: `npm run build --workspace=api`).
- Keep PRs scoped: code + tests + docs when behavior changes.
- Update the relevant `*.instructions.md` when new architectural slices or conventions are introduced.
- Do not inline full route/component files in review feedback — quote only the lines needing change.

---

## Tone & Feedback Style

Concise, actionable. Include a "because" clause for non-trivial recommendations. Offer one preferred solution with an optional lightweight alternative.

---

If new subsystems are added (e.g., `mobile/`, `worker/`), create a new `*.instructions.md` with matching `applyTo` globs instead of expanding this file.
