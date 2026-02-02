# TJ Deep Research - Agent Guide

This document provides essential information for AI coding agents working on the TJ Deep Research project.

## Project Overview

**TJ Deep Research** is a Deep Equity Research Assistant web application that orchestrates advanced "Thinking" and "Task" AI models with live web search to generate in-depth equity research reports. The application is built as a client-side PWA (Progressive Web App) that runs entirely in the browser.

### Key Characteristics

- **Client-first Architecture**: All research processing and storage happen locally in the browser
- **BYOK (Bring Your Own Key)**: Users provide their own API keys via the Settings UI - no server-side API costs
- **Multi-Provider Support**: 15+ AI providers (OpenAI, Anthropic, Google, DeepSeek, xAI, Mistral, etc.) and 5+ search providers
- **Research Modes**: Company Deep Dive, Bulk Company Research, Market Research, Free Form Research, Company Discovery, Case Studies, Doc Storage, Prompt Library
- **Long-running Operations**: Research can take 3-10 minutes, requires SSE (Server-Sent Events) support

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15.5+ with App Router |
| Language | TypeScript 5.x (Strict mode) |
| UI Library | React 19.1+ |
| Styling | Tailwind CSS 3.4+ |
| UI Components | shadcn/ui (New York style) |
| State Management | Zustand with persist middleware |
| AI SDK | Vercel AI SDK (@ai-sdk/* packages) |
| Testing | Vitest (unit), Playwright (e2e) |
| Package Manager | pnpm |
| Node Version | >= 22.x |

## Project Structure

```
/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes (AI proxies, search, SSE, MCP)
│   │   ├── layout.tsx         # Root layout with Theme/I18n providers
│   │   ├── page.tsx           # Main page with research tabs
│   │   └── globals.css        # Global styles + Tailwind
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── Internal/          # App internals (Header, SearchArea, etc.)
│   │   ├── Research/          # Research flow components
│   │   ├── ResearchModes/     # Different research mode UIs
│   │   ├── Knowledge/         # Knowledge base components
│   │   └── MagicDown/         # Markdown rendering with Mermaid
│   ├── store/                 # Zustand stores
│   │   ├── setting.ts         # User settings + encrypted API keys
│   │   ├── task.ts            # Research task state
│   │   ├── history.ts         # Research history
│   │   └── ...
│   ├── hooks/                 # Custom React hooks
│   │   ├── useDeepResearch.ts # Main research orchestration
│   │   ├── useAiProvider.ts   # AI provider creation
│   │   └── ...
│   ├── utils/                 # Utility functions
│   │   ├── deep-research/     # Core research engine
│   │   ├── api/               # Provider-specific API utilities
│   │   └── ...
│   ├── middleware.ts          # Next.js middleware (auth, proxying)
│   ├── middleware/            # Middleware helpers
│   ├── types.d.ts             # Global TypeScript types
│   └── locales/               # i18n translations (en-US.json)
├── tests/
│   ├── unit/                  # Vitest tests
│   ├── integration/           # Integration tests
│   └── e2e/                   # Playwright tests
├── docs/                      # Additional documentation
├── Dockerfile                 # Container config for Railway
├── railway.json              # Railway deployment config
└── vercel.json               # Vercel deployment config
```

## Build and Development Commands

```bash
# Development (uses Turbopack)
pnpm dev

# Production build
pnpm build

# Build standalone (for Docker)
pnpm build:standalone

# Start production server
pnpm start

# Linting
pnpm lint

# Unit tests (Vitest)
pnpm test

# E2E tests (Playwright - requires build first)
pnpm test:e2e
```

## Code Style Guidelines

### TypeScript

- **Strict mode enabled** - all strict TypeScript options are on
- Use explicit return types for exported functions
- Type all function parameters
- Use `interface` for object shapes, `type` for unions/intersections

### React

- Use functional components with hooks
- Client components marked with `"use client"`
- Dynamic imports for heavy components to reduce bundle size
- Error boundaries implemented in `ErrorBoundary.tsx`

### File Organization

- Co-locate related files (component + styles + tests)
- Use barrel exports (`index.ts`) for cleaner imports
- Follow Next.js App Router conventions

### Naming Conventions

- Components: PascalCase (`CompanyDeepDive.tsx`)
- Hooks: camelCase with `use` prefix (`useDeepResearch.ts`)
- Utilities: camelCase (`text.ts`)
- Types/Interfaces: PascalCase (`SearchTask`, `DeepResearchOptions`)
- Constants: UPPER_SNAKE_CASE for true constants

### Import Order

1. React/Next.js imports
2. Third-party libraries
3. Internal absolute imports (`@/components`, `@/utils`)
4. Relative imports
5. Type imports

## Testing Strategy

### Unit Tests (Vitest)

- Location: `tests/` directory
- Config: `vitest.config.ts`
- Setup: `tests/setup.ts`
- Coverage thresholds: 40% (lines, functions, branches, statements)

```bash
# Run unit tests
pnpm test

# Run with coverage
pnpm test -- --coverage
```

### E2E Tests (Playwright)

- Location: `tests/e2e/`
- Config: `playwright.config.ts`
- Uses standalone server for testing
- Chromium only (configurable)

```bash
# Build first, then run E2E
pnpm test:e2e
```

### Test Patterns

- Mock external APIs in unit tests
- Use MSW (mock service worker) pattern for fetch mocking
- Test stores with mocked localStorage
- Integration tests verify full research flows

## Security Considerations

### API Key Storage

API keys are **encrypted** before storing in localStorage:

```typescript
// src/store/setting.ts
- Uses AES encryption with device-specific key derivation
- SENSITIVE_FIELDS array defines which fields to encrypt
- Encryption key derived from browser fingerprint + salt
```

### Server-Side Security

- `ACCESS_PASSWORD` protects SSE/crawler/MCP endpoints
- Rate limiting on proxy endpoints (configurable via env vars)
- CORS properly configured in middleware
- No server-side API keys required for normal operation

### Environment Variables

**NEVER** expose provider API keys via `NEXT_PUBLIC_*`:

```bash
# Good - server-side only
OPENAI_API_KEY=xxx

# Bad - exposes to browser
NEXT_PUBLIC_OPENAI_API_KEY=xxx
```

### Middleware Authentication

The `src/middleware.ts` handles:
- AI provider proxy authentication
- Search provider proxy authentication
- Special route protection (SSE, crawler, MCP)
- Model validation and filtering
- Request signature verification

## Key Development Patterns

### Research Flow Architecture

```
User Query → Write Report Plan → Generate SERP Queries → 
Run Search Tasks (parallel) → Write Final Report → Save to History
```

### State Management Pattern

```typescript
// Use Zustand for global state
const store = create(persist((set) => ({
  // state
}), { name: 'storeName', storage: encryptedStorage }));

// Access in components
const { value, update } = useStore();

// Access outside React
const state = useStore.getState();
```

### AI Provider Creation

```typescript
// src/hooks/useAiProvider.ts
const createModelProvider = async (model: string, options?: ProviderOptions) => {
  // Returns Vercel AI SDK compatible model
};
```

### Adding a New AI Provider

1. Add provider config to `src/store/setting.ts` (API keys, models)
2. Add proxy route in `src/app/api/ai/[provider]/[...slug]/route.ts`
3. Add middleware handler in `src/middleware.ts`
4. Add API utility in `src/utils/api/[provider].ts`
5. Update `src/hooks/useAiProvider.ts` to support the provider

### Adding a New Search Provider

1. Add search utility in `src/utils/deep-research/search.ts`
2. Add proxy route in `src/app/api/search/[provider]/[...slug]/route.ts`
3. Add middleware handler in `src/middleware.ts`
4. Update `src/hooks/useWebSearch.ts` to support the provider

## Deployment

### Railway (Recommended)

Supports long-running SSE connections (15+ minutes).

```bash
# Environment variables needed:
NODE_ENV=production
PORT=3000
ACCESS_PASSWORD=optional_but_recommended
```

### Vercel

**Note**: 60-second timeout on serverless functions. Research may timeout.

```bash
# Deploy via CLI
vercel
```

### Docker

```bash
# Build and run
docker build -t deep-research .
docker run -p 3000:3000 -e ACCESS_PASSWORD=xxx deep-research
```

## Common Issues & Solutions

### "API key required" Error

- **Expected**: User needs to add API key in Settings UI
- Not a bug - this is the BYOK security model

### Rate Limit Errors

- Check `RATE_LIMIT_*` environment variables
- Default: 100 req/hour for AI proxies, 200 for search

### Build Failures

- Ensure Node.js >= 22.x
- Delete `.next` and `node_modules` if cache issues
- Run `pnpm install` to ensure lockfile is in sync

### Type Errors

- The project uses strict TypeScript
- `any` types allowed with `@ts-expect-error` comment explaining why
- Run `pnpm lint` to catch issues early

## Important Files Reference

| File | Purpose |
|------|---------|
| `src/store/setting.ts` | User settings, encrypted API key storage |
| `src/hooks/useDeepResearch.ts` | Main research orchestration hook |
| `src/utils/deep-research/index.ts` | Core research engine class |
| `src/middleware.ts` | API authentication and proxying |
| `src/app/api/sse/live/route.ts` | SSE endpoint for live research updates |
| `src/constants/prompts.ts` | System prompts for research |
| `src/utils/deep-research/prompts.ts` | Research-specific prompts |
| `tailwind.config.ts` | Theme configuration |
| `next.config.ts` | Next.js config with rewrites for API proxies |

## Resources

- [README.md](./README.md) - User-facing documentation
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed deployment guide
- [RAILWAY.md](./RAILWAY.md) - Railway-specific deployment
- [AI_MODELS_GUIDE.md](./AI_MODELS_GUIDE.md) - Model selection guide
- [docs/deep-research-api-doc.md](./docs/deep-research-api-doc.md) - API documentation
