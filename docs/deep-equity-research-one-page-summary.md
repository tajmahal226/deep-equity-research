# Deep Equity Research — One-Page App Summary

## What it is
- TJ Deep Research is a Next.js app that orchestrates AI reasoning/task models with web search to produce equity research reports quickly.
- The app is designed to run research workflows in the browser, with user-provided API keys configured in Settings.

## Who it's for
- Primary persona: equity researchers, investors, and analysts who need fast, structured company and market intelligence.

## What it does
- Offers 8 research modes: Company Deep Dive, Bulk Company Research, Market Research, Free Form, Company Discovery, Case Studies, Doc Storage, and Prompt Library.
- Supports multiple AI providers (OpenAI, Anthropic, Google, OpenRouter, DeepSeek, Ollama, and others).
- Supports multiple search providers including Tavily, Exa, Firecrawl, model-native search, and SearXNG.
- Streams long-running deep-research progress/results via Server-Sent Events (SSE).
- Persists app settings/history state in browser storage using Zustand; sensitive settings fields are encrypted before localStorage persistence.
- Includes history/knowledge side panels and prompt libraries for repeatable workflows.

## How it works (repo-evidenced architecture)
- UI layer: Next.js App Router page dynamically loads research mode components and side panels (Settings, History, Knowledge).
- State layer: Zustand stores manage global UI state, settings, tasks, history, and knowledge.
- Orchestration layer: `useDeepResearch` coordinates model calls, question/plan generation, web search, and report assembly with streaming AI SDK responses.
- API layer: `/api/sse` validates keys, configures provider/search endpoints, creates a `DeepResearch` engine instance, and streams events back to the client.
- Integration layer: dedicated API proxy routes exist for AI and search providers under `/api/ai/*` and `/api/search/*`.

## How to run (minimal getting started)
1. Install deps: `pnpm install`
2. Start dev server: `pnpm dev`
3. Open `http://localhost:3000`
4. In Settings, enter AI provider key and search provider key.
5. Choose a research mode and run a query.

## Not found in repo
- Formal SLA/performance targets and canonical production architecture diagram: **Not found in repo**.
