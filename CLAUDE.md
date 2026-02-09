# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TJ Deep Research is a Next.js web application for conducting deep equity research using AI models with web search capabilities. It orchestrates "thinking" models (for reasoning and planning) with "task" models (for execution and synthesis) to generate comprehensive investment research reports.

**Tech Stack:**
- **Framework:** Next.js 16 with App Router (standalone output for Docker)
- **Language:** TypeScript with strict mode
- **State Management:** Zustand with persist middleware (encrypted localStorage for API keys)
- **Styling:** Tailwind CSS + Radix UI components
- **AI SDK:** Vercel AI SDK (`ai` package) with provider-specific SDKs (Anthropic, OpenAI, Google, DeepSeek, Mistral, OpenRouter, Ollama, xAI, Fireworks, Moonshot, Cohere, Together, Groq, Perplexity)
- **Testing:** Vitest (unit/integration), Playwright (E2E)
- **Package Manager:** pnpm (required)

## Development Commands

```bash
# Development (with Turbopack for faster iteration)
pnpm dev

# Production build and run
pnpm build
pnpm start

# Linting
pnpm lint

# Run all tests
pnpm test

# Run single test file (vitest)
pnpm test -- tests/unit/create-proxy-handler.test.ts

# E2E tests (requires production build first)
pnpm build && pnpm test:e2e
```

## High-Level Architecture

### Application Structure

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── ai/               # AI provider proxy routes (one per provider)
│   │   │   ├── create-proxy-handler.ts  # Generic proxy handler factory
│   │   │   ├── helpers.ts    # Proxy utilities (buildUpstreamURL, createProxiedResponse)
│   │   │   └── [provider]/[...slug]/route.ts  # Provider-specific routes
│   │   ├── search/           # Search provider proxy routes
│   │   ├── company-research/  # Company deep-dive SSE endpoint
│   │   ├── bulk-company-research/  # Multi-company research endpoint
│   │   ├── sse/              # General deep research SSE endpoint
│   │   ├── mcp/              # Model Context Protocol server
│   │   ├── financial-data/   # Financial data APIs
│   │   └── middleware/       # API middleware (rate limiting)
│   ├── layout.tsx            # Root layout with providers
│   └── page.tsx              # Main page with dynamic imports
├── components/               # React components
│   ├── Internal/             # Internal UI components (Header, ResearchTabs, etc.)
│   ├── Research/             # Research display components (TaskItem, SearchResult)
│   ├── ResearchModes/        # Per-mode components (FreeForm, CompanyDeepDive, etc.)
│   ├── Knowledge/            # Document/knowledge management
│   ├── MagicDown/            # Markdown editor/viewer with math (KaTeX), mermaid, syntax highlighting
│   ├── Setting.tsx           # Settings dialog
│   └── ui/                   # Radix UI primitives (shadcn/ui)
├── store/                    # Zustand stores
│   ├── global.ts             # UI state (modals open/closed)
│   ├── setting.ts            # User settings with encrypted storage
│   ├── task.ts               # Research task state
│   ├── history.ts            # Research history
│   └── knowledge.ts          # Knowledge base state
├── utils/                    # Utility functions
│   ├── deep-research/        # Core research orchestration
│   │   ├── index.ts          # DeepResearch class (main research loop)
│   │   ├── prompts.ts        # Research prompts
│   │   ├── search.ts         # Search provider factory
│   │   └── provider.ts       # AI provider factory with model-specific settings
│   ├── api/                  # Provider-specific API utilities
│   ├── parser/               # Document parsers (PDF, Office, text)
│   ├── company-deep-research/ # Company-specific research logic
│   ├── openai-models.ts      # OpenAI model metadata
│   ├── openai-responses-provider.ts  # OpenAI Responses API
│   ├── xai-models.ts         # xAI model metadata
│   ├── model-metadata.ts     # Generic model metadata utilities
│   ├── sse.ts                # Server-Sent Events utilities
│   ├── cache-*.ts            # Cache utilities (with TTL)
│   └── *.ts                  # Other utilities
├── constants/                # Constants
│   ├── prompts.ts            # System prompts
│   ├── token-limits.ts       # Per-model token limits
│   └── locales.ts            # i18n translations
└── libs/mcp-server/          # MCP server implementation
```

### Key Architectural Patterns

#### 1. AI Provider Proxy Pattern

All AI provider routes (`/api/ai/[provider]/[...slug]/route.ts`) use a generic `createProxyHandler()` factory from `create-proxy-handler.ts`. This handler:
- Applies rate limiting via `rate-limit.ts`
- Builds upstream URLs using provider-specific base URLs from `next.config.ts`
- Supports custom headers and request preprocessing per provider
- Returns proxied responses using `createProxiedResponse()`

When adding a new AI provider:
1. Create route at `src/app/api/ai/[provider]/[...slug]/route.ts`
2. Export a handler using `createProxyHandler(apiBaseUrl, options)`
3. Add provider-specific settings in `src/utils/api/[provider].ts`
4. Add base URL configuration in `next.config.ts`

#### 2. Research Orchestration (Deep Research)

The core research flow is implemented in `src/utils/deep-research/index.ts`:

```
query → writeReportPlan() → generateSERPQuery() → runSearchTask() → writeFinalReport()
```

- **Thinking Model**: Used for planning (`writeReportPlan`), query generation (`generateSERPQuery`), and synthesis (`writeFinalReport`)
- **Task/Networking Model**: Used for processing search results (`runSearchTask`)
- **Search Provider**: Either external (Tavily, Exa, Firecrawl) or model-built-in (OpenAI web search, Google grounding, OpenRouter plugins)

Research modes use Server-Sent Events (SSE) for real-time progress updates. Events include: `progress`, `message`, `reasoning`, `error`, `complete`, `keepalive`.

#### 3. State Management with Encryption

User settings (including API keys) are stored in Zustand with persist middleware. API keys are encrypted before storage using `crypto-js` AES encryption with a device-derived key. See `src/store/setting.ts` for the implementation.

#### 4. Multi-Provider AI Support

Each AI provider has its own configuration in `src/utils/api/[provider].ts`. The `createAIProvider()` function in `provider.ts` abstracts provider differences:
- Model-specific parameter filtering (via `filterModelSettings()`)
- Token limit handling (via `getMaxTokens()` from `constants/token-limits.ts`)
- Provider-specific features (Google search grounding, OpenAI web search tools)

#### 5. Model Metadata System

Models are defined with metadata in `src/utils/model-metadata.ts`. The system supports:
- Thinking vs networking/task model classification
- Per-model token limits
- Provider filtering
- Model aliases and display names

## Important Implementation Details

### SSE Keep-Alive

Research operations can take 3-15 minutes. To prevent connection drops:
- Send keepalive events every 30 seconds (`OPERATION_TIMEOUTS.SSE_KEEPALIVE`)
- Use `dynamic = "force-dynamic"` on API routes
- Set appropriate `maxDuration` (up to 300 seconds on Vercel Hobby)

### Timeout Configuration

All operation timeouts are centralized in `src/utils/timeout-config.ts`:
- `COMPANY_FAST`: 60 seconds (no web searches)
- `COMPANY_MEDIUM`: 180 seconds (limited searches)
- `COMPANY_DEEP`: 300 seconds (full research)

### Think Tag Processing

The `ThinkTagStreamProcessor` in `src/utils/text.ts` handles special `<think>` tags used by some reasoning models. It separates reasoning from output content.

### Deployment Considerations

**Railway is recommended** over Vercel because:
- Railway supports long-running SSE connections (15+ minutes)
- Vercel serverless functions timeout at 60 seconds
- The app uses `output: 'standalone'` in `next.config.ts` for Docker compatibility

For multi-user deployments, do NOT set server-side API keys. Let users provide their own via the Settings UI.

## Testing

- Unit/integration tests use Vitest with jsdom environment
- Test setup is in `tests/setup.ts`
- E2E tests use Playwright against the production build
- Integration tests test actual AI provider APIs
- Mock responses are in `tests/api/mocks.ts`

## i18n

The app uses react-i18next. Translations are in `src/constants/locales.ts`. The language is stored in the `setting` Zustand store.

## Document Parsing

Supported formats:
- PDF: via `pdfjs-dist`
- Office documents: via `@zip.js/zip.js` with custom parsing in `src/utils/parser/officeParser.ts`
- Plain text: via `src/utils/parser/textParser.ts`
