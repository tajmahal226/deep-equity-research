# Agent Guide

This guide is for coding agents working in `/home/tyler/deep-equity-research`.

## Must-Read Rules

- No Cursor rules found in `.cursor/rules/` or `.cursorrules`.
- No Copilot rules found in `.github/copilot-instructions.md`.

## ExecPlans

When writing complex features or significant refactors, use an ExecPlan (as described in `PLANS.md`) from design to implementation.

## Build, Lint, Test

Use `pnpm` (project standard). Node >= 22.x.

```bash
# Dev (Turbopack)
pnpm dev

# Production build
pnpm build

# Standalone build (used by Playwright webServer)
pnpm build:standalone

# Start production server
pnpm start

# Lint
pnpm lint

# Unit tests (Vitest)
pnpm test

# E2E tests (Playwright)
pnpm test:e2e
```

### Single Test (Vitest)

```bash
# Run a single file
pnpm test -- tests/unit/my-file.test.ts

# Run tests matching a name pattern
pnpm test -- -t "should do thing"

# Watch a file interactively
pnpm test -- --watch tests/unit/my-file.test.ts
```

### Single Test (Playwright)

```bash
# Run a single file
pnpm test:e2e -- tests/e2e/example.spec.ts

# Run a single test by title
pnpm test:e2e -- -g "user can save"

# Run with headed browser
pnpm test:e2e -- --headed
```

Notes:
- `pnpm test:e2e` builds before running and starts the standalone server.
- Playwright base URL defaults to `http://127.0.0.1:3000` unless env overrides.

## Code Style Guidelines

### TypeScript

- Strict mode is on (`tsconfig.json`).
- Prefer explicit return types for exported functions.
- Avoid `any` where possible; ESLint allows it but use sparingly.
- Use `interface` for object shapes, `type` for unions/intersections.
- Favor narrow types over broad unions; prefer `unknown` to `any` for inputs.

### React / Next.js

- Functional components with hooks only.
- Add `"use client"` at the top of client components.
- Follow App Router conventions under `src/app/`.
- Use dynamic imports for heavy client-only components when needed.

### Imports

Order imports top-to-bottom:
1. React / Next.js
2. Third-party packages
3. Internal absolute imports (`@/`)
4. Relative imports
5. Type-only imports (`import type`)

Prefer named imports; avoid default imports unless the module expects it.

### Formatting

- No Prettier config; rely on ESLint and existing file formatting.
- Keep JSX attributes readable; break long props onto new lines.
- Use single quotes in TS/JS where consistent; follow existing file style.

### Naming

- Components: PascalCase (`CompanyDeepDive.tsx`).
- Hooks: camelCase with `use` prefix (`useDeepResearch`).
- Utilities: camelCase (`formatCurrency`).
- Types/Interfaces: PascalCase (`ResearchTask`).
- Constants: UPPER_SNAKE_CASE for true constants.

### File Organization

- Co-locate components with related logic/tests where practical.
- Use barrel exports (`index.ts`) only when already used in that folder.

### Error Handling

- Prefer explicit error handling and user-friendly messages.
- Avoid swallowing errors; log or surface errors where appropriate.
- Keep error boundaries in UI layers; avoid generic try/catch in render paths.

### State & Data

- Zustand is used for app state (`src/store`).
- Access outside React via `useStore.getState()`.
- Persisted state may include encrypted fields; follow existing patterns.

### Styling

- Tailwind CSS is the default styling system.
- Prefer existing utility patterns before adding custom CSS.
- Use `clsx`/`tailwind-merge` if conditional class logic is needed.

### Tests

- Vitest unit tests live under `tests/`.
- Playwright E2E tests live under `tests/e2e/`.
- Keep tests deterministic; mock network where feasible.

## Project Structure (Quick)

```
src/app/          Next.js App Router pages and API routes
src/components/   UI and feature components (includes shadcn/ui)
src/hooks/        Custom React hooks
src/store/        Zustand stores
src/utils/        Utilities and research engine logic
tests/            Unit/integration tests
tests/e2e/        Playwright tests
```

## Quick References

- ESLint config: `eslint.config.mjs`
- Vitest config: `vitest.config.ts`
- Playwright config: `playwright.config.ts`
- TS config: `tsconfig.json`
