# Audit API Integrations and LLM Compatibility

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This document must be maintained in accordance with `PLANS.md` from the repository root.

## Purpose / Big Picture

The goal is to identify why the app breaks around API integrations and model compatibility, then produce a clear, verifiable list of issues with evidence and reproducible steps. After this audit, a contributor should be able to run a small set of checks and see which providers, routes, and models fail, and why, without prior knowledge of this repo.

## Progress

- [x] (2026-02-05 02:35Z) Inventory provider integration paths and map data flow from settings to API calls.
- [x] (2026-02-05 02:45Z) Create a compatibility matrix that lists provider, model defaults, API base URL, and request path.
- [x] (2026-02-05 02:55Z) Identify mismatch risks by static inspection (model normalization, headers, baseURL/path composition, request schemas).
- [x] (2026-02-05 15:20Z) Execute lightweight runtime checks for API routes that do not require real credentials (health: 200; health-check: 503).
- [x] (2026-02-05 03:10Z) Summarize findings, add reproducible steps, and draft follow-on fix plan.

## Surprises & Discoveries

- Observation: Search providers bocha and searxng are wired in settings and client logic but have no proxy routes.
  Evidence: `src/hooks/useWebSearch.ts` references `/api/search/bocha` and `/api/search/searxng`, while `src/app/api/search/` only includes tavily/firecrawl/exa routes.
- Observation: Runtime checks could not be executed because the dev server is not running on port 3000.
  Evidence: `curl` to `http://127.0.0.1:3000/api/health` and `/api/health-check` failed with connection refused.
- Observation: Health endpoint succeeds, but health-check returns HTTP 503.
  Evidence: `curl -i http://127.0.0.1:3000/api/health` returned 200 with JSON, while `/api/health-check` returned 503.

## Decision Log

- Decision: Use static analysis first and only run safe runtime checks without secrets.
  Rationale: The request is to audit for breakage; static inspection covers most integration mismatches without risking credentials or requiring paid APIs.
  Date/Author: 2026-02-05 / Kilo

## Outcomes & Retrospective

Audit completed with static analysis and basic runtime checks. Key risks documented in `plans/api-llm-compat-audit-report.md`.

## Context and Orientation

This repository is a Next.js App Router project. The AI provider wiring spans settings, model resolution, and runtime providers. The key files are:

- `src/hooks/useAiProvider.ts` for selecting provider config and building baseURL/apiKey.
- `src/utils/deep-research/provider.ts` for constructing AI SDK providers and filtering model settings.
- `src/utils/openai-models.ts` and `src/utils/openai-responses-provider.ts` for OpenAI model normalization and Responses API support.
- `src/utils/xai-models.ts` for Grok model compatibility mapping.
- `src/utils/provider.ts` for default model selection and provider fallbacks.
- `src/hooks/useWebSearch.ts` and `src/utils/deep-research/search.ts` for search provider handling and HTTP requests.
- `src/app/api/ai/*/[...slug]/route.ts` for server-side API proxy routes.
- `src/utils/api/*` for provider-specific APIs used by legacy flows.

Terms:
- Provider: A vendor or gateway (OpenAI, Anthropic, OpenRouter, etc.).
- Model compatibility: Whether the model name, API endpoint, and request schema are aligned for that provider.
- Proxy mode: Using server routes under `src/app/api` instead of direct calls from the browser.

## Plan of Work

First, enumerate all AI and search providers and map each to its baseURL, proxy path, version path, and default models using `useAiProvider.ts`, `provider.ts`, and `provider.ts` defaults. Then verify whether model normalization is applied for each provider and whether request schema differences (e.g., OpenAI Responses API vs Chat Completions) are handled in the correct paths. Next, inspect each proxy route under `src/app/api/ai` and confirm it forwards to the same base path/versions defined in the client. For search providers, validate that each provider is implemented consistently in `useWebSearch.ts` and `search.ts` and that mode switching (local vs proxy) builds correct URLs.

Then, produce a compatibility matrix with evidence for each provider/model pair: which endpoint is used, whether any settings are filtered or remapped, and known risky models. Identify gaps where a provider is present in settings but not implemented in utilities or vice versa, and any mismatched path concatenations or version mismatches.

Finally, run safe runtime checks: call local health endpoints and any API routes that do not require credentials (health, sse, or route handlers that validate signature only). Capture errors and include them as evidence.

## Concrete Steps

Work from the repository root `/home/tyler/deep-equity-research`.

1) Inventory providers and routes.
   - Read `src/hooks/useAiProvider.ts`, `src/utils/deep-research/provider.ts`, `src/utils/provider.ts`.
   - Read all `src/app/api/ai/*/[...slug]/route.ts` files.
   - Read `src/utils/api/*` implementations to see any legacy code paths.
   Expected output: a list of providers and their paths with notes.

2) Build a compatibility matrix.
   - Create a table in a new audit report (see Artifacts) listing provider, default models, baseURL, version path, proxy path, and special handling (Responses API, OpenAI-compatible, tool support).
   - Note where model normalization or settings filtering is required.

3) Inspect search providers.
   - Read `src/hooks/useWebSearch.ts` and `src/utils/deep-research/search.ts`.
   - Check for missing providers or mismatched routes between local and proxy modes.

4) Run safe runtime checks.
   - Start the app if needed or call local API routes directly.
   - Example (if app is running): GET `http://127.0.0.1:3000/api/health` and `http://127.0.0.1:3000/api/health-check`.
   - Capture responses and errors.

5) Produce findings.
   - Summarize issues with evidence and reproduction steps.
   - Categorize: critical (breaks flows), major (wrong model/endpoint), minor (risk/edge).

## Validation and Acceptance

The audit is complete when:

- The compatibility matrix covers every configured provider in `useAiProvider.ts` and `resolveProviderModels`.
- Each proxy route has a confirmed mapping to a baseURL and version path.
- Each search provider has confirmed local and proxy URL behavior.
- At least two local health routes are tested and documented with responses.
- The final report lists concrete, reproducible issues and suggests next steps for fixes.

## Idempotence and Recovery

All steps are read-only or safe HTTP GET requests. If a runtime check fails, record the failure and proceed; do not attempt credentialed calls without explicit user-provided keys.

## Artifacts and Notes

Audit report written to `plans/api-llm-compat-audit-report.md` with compatibility matrix, findings, and evidence references.

## Interfaces and Dependencies

No new dependencies are required. Use existing tooling and repository files. If runtime checks are run, use the project’s standard dev server (`pnpm dev`) and direct HTTP calls from the browser or curl. Do not run paid API calls without explicit keys.

Change log: (initial) Created ExecPlan for full audit of API integration and model compatibility.
