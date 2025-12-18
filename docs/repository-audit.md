# Repository Security & Quality Audit

## Phase 1 – Repository Assessment
- **Structure:** `src/` (Next.js app, components, hooks, Zustand stores, utils), `public/` (static assets), `tests/` (Vitest suites), `docs/` (guides), root configs (`next.config.ts`, `tailwind.config.ts`, `vitest.config.mts`, `eslint.config.mjs`), and automation under `.github/workflows/`.
- **Tech stack:** Next.js 15, React 19, TypeScript, Tailwind, Zustand, Vercel AI SDK, Radix UI, Vitest, Playwright; CI via GitHub Actions (docker build/publish, npm publish, GHCR, sync jobs).
- **Entry points & critical paths:** `src/app/page.tsx` (UI shell), `src/app/api/*` (research/SSE/search/middleware endpoints), `src/utils/deep-research` and `src/utils/api/*` (model orchestration), `src/store/*` (client state).
- **Build/test commands:** `pnpm build`, `pnpm lint`, `pnpm test`, `pnpm dev` (Turbopack).

## Phase 2 – Bug & Vulnerability Discovery
- Ran `pnpm audit --json` (pre-fix) and identified five dependency CVEs:
  - **vite** (GHSA-g4jq-h2w9-997c / CVE-2025-58751) – public directory traversal bypass in dev server.
  - **js-yaml** (CVE-2025-16606) – prototype pollution risk.
  - **glob** (GHSA-5j98-mcp5-4vw2 / CVE-2025-64756) – CLI command injection.
  - **mdast-util-to-hast** (GHSA-4fh9-h7wg-q85m / CVE-2025-66400) – unsanitized class injection in markdown.
  - **ai** (GHSA-rwvc-j5jr-mgvh / CVE-2025-48985) – file whitelist bypass.
- Static scan of API code confirmed no additional exploitable input paths beyond dependency issues; tests already covered primary flows.

## Phase 3 – Prioritization
- All findings categorized as **security vulnerabilities**; prioritized by upstream CVSS and application exposure. Dev-server-only issues (vite) still upgraded to avoid transitive risk in tooling. Markdown sanitation and file whitelist issues treated as user-impacting due to rich text rendering and future file support.

## Phase 4 – Fix Implementation
- **Dependency upgrades:** Raised `ai` to `5.0.115` and `zod` to `^3.25.76` to satisfy peer requirements and pull patched security fixes.
- **Forced patched transitive versions:** Added `pnpm.overrides` for `vite@7.3.0`, `mdast-util-to-hast@13.2.1`, `js-yaml@4.1.1`, and `glob@10.5.0`.
- Result: `pnpm audit --json` now reports **0 vulnerabilities**.

## Phase 5 – Validation
- `pnpm lint` (Next.js ESLint) – clean.
- `pnpm test` – 51 test files / 273 tests passing.
- `pnpm audit --json` – zero outstanding issues.

## Phase 6 – Documentation & Reporting
- This document plus machine-readable summaries (`repository-audit.json`, `repository-audit.csv`) capture findings, impact, and fixes.

## Phase 7 – Continuous Improvement Recommendations
- Keep dependency hygiene via scheduled `pnpm audit` in CI.
- When enabling file uploads or custom markdown, retain upstream sanitization defaults and add server-side validation.
- Consider locking dev servers to localhost when running Vite/Vitest to avoid network exposure of tooling.
