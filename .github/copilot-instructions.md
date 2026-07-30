# OctoCAT Supply Chain Management Application – General Copilot Instructions

These are repository-wide guidelines. Path‑scoped files in `.github/instructions/*.instructions.md` provide focused guidance for specific areas (frontend, API, database).

## High-Level Architecture

TypeScript monorepo with:
- `api/` Express REST API (SQLite persistence, repository pattern, Swagger docs)

- `frontend/` React + Vite + Tailwind UI
- Shared demo + infra docs under `docs/` and deployment scripts under `infra/`

Refer to `docs/architecture.md` and `docs/sqlite-integration.md` for deeper details. Avoid restating them in reviews and link instead.

## General Review Guidance
When generating suggestions:
1. Prefer incremental, minimal diffs; preserve existing style and naming.
2. Surface security, correctness, and data integrity issues before micro-optimizations.

3. Encourage type safety (no `any` unless justified). Suggest adding/refining model or DTO types when gaps appear.

4. Flag duplicate logic that belongs in a shared utility or repository method.
5. Ensure error handling uses existing custom error types where appropriate (e.g., NotFound, Validation, Conflict) and propagates consistent HTTP status codes via middleware.
6. Encourage tests: request unit tests for new repository logic and component tests (or at least React Testing Library coverage) for critical UI paths.
7. For performance concerns, highlight N+1 query patterns, unnecessary data loading, or large bundle additions.
8. Prefer environment variable driven configuration; avoid hard‑coded paths/secrets.

## Monorepo Workflow

- Build frequently: `npm run build --workspace=api` or `--workspace=frontend` (root build runs both)

- Keep PRs scoped: code + tests + docs (architecture or build notes) when behavior changes.
- Update related instruction files if new folders or architectural slices are introduced.

## Language-Specific Best Practices

### TypeScript (api/, frontend/)
- Follow the W3Schools TypeScript best-practice baseline for consistency: https://www.w3schools.com/typescript/typescript_best_practices.php
- Prefer explicit types for function params/returns and exported values; rely on inference for obvious local variables.
- Use `interface`/`type` for data contracts and DTOs; avoid `any` unless there is a clear, documented reason.
- Prefer `const` by default; use `readonly` for fields that must not be reassigned after creation.
- Keep strict compiler behavior enabled (`strict`, `noImplicitAny`, `strictNullChecks`) and fix type drift instead of suppressing errors.
- Use enums or string-literal unions for finite state sets (status values, workflow states) instead of free-form strings.

### SQL (api/database/migrations, api/database/seed)
- Add forward-only sequential migrations; never rewrite historical migration files that may already be applied.
- Keep schema constraints close to the data (`NOT NULL`, `CHECK`, FK rules) and add indexes for foreign keys and frequent filters.
- Prefer deterministic seed data for demo/test stability and update seeds whenever required columns change.
- In application code, always parameterize SQL and never concatenate user input into query text.

### Shell (demo/resources, .github/hooks, frontend/entrypoint.sh)
- Write scripts to be safe in CI/non-interactive environments (`set -euo pipefail` when compatible).
- Quote variable expansions and paths to avoid word-splitting/globbing bugs.
- Keep scripts idempotent where practical and return non-zero exit codes for failure paths.

### Bicep / Infrastructure as Code (infra/)
- Keep infrastructure values parameterized and environment-driven; avoid hard-coded secrets or environment-specific IDs.
- Prefer modular, composable resources and clear outputs for downstream deployment/workflow steps.
- Validate and review IaC changes with security in mind (least-privilege access, explicit networking/public exposure decisions).

## Do Not Repeat
Do not inline full API route or component files in review feedback unless absolutely necessary: quote only the lines requiring change. Summarize low‑impact nits.

## Escalation Order for Suggestions
1. Security / data integrity
2. Logical / functional correctness
3. Performance / scalability
4. Maintainability / duplication
5. Readability / consistency
6. Style / minor formatting

## Tone & Feedback Style
Be concise, actionable, and cite a rationale ("because" clause) for non-trivial recommendations. Offer one preferred solution; optionally a lightweight alternative.

---
If new subsystems are added (e.g., `mobile/`, `worker/`), create a new `*.instructions.md` with `applyTo` globs instead of bloating this file.
