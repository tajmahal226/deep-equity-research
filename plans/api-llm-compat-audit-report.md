# API + LLM Compatibility Audit Report

Date: 2026-02-05

## Scope

Focused on provider integration paths, model compatibility handling, and search provider routing. This report is based on static inspection of provider wiring and proxy routes.

## Compatibility Matrix (Static)

Provider | Client base URL (local) | Version path | Proxy path | Proxy upstream base | Default models | Special handling
--- | --- | --- | --- | --- | --- | ---
openai | https://api.openai.com | /v1 | /api/ai/openai | https://api.openai.com | gpt-5.2-pro / gpt-5.2 | Responses API routing + model normalization in proxy handler; settings filtering for responses models
anthropic | https://api.anthropic.com | /v1 | /api/ai/anthropic | https://api.anthropic.com | claude-opus-4-5 / claude-sonnet-4-5 | temperature capped at 1; anthropic headers set
google | https://generativelanguage.googleapis.com | /v1beta | /api/ai/google | https://generativelanguage.googleapis.com | gemini-3-pro-preview / gemini-3-flash-preview | x-goog-api-key header; search grounding toggles for networking models
deepseek | https://api.deepseek.com | /v1 | /api/ai/deepseek | https://api.deepseek.com | deepseek-reasoner / deepseek-chat | basic OpenAI-compatible usage
xai | https://api.x.ai | /v1 | /api/ai/xai | https://api.x.ai | grok-4 / grok-4-1-fast-non-reasoning | model normalization for v1 reasoning models; treated OpenAI-compatible
mistral | https://api.mistral.ai | /v1 | /api/ai/mistral | https://api.mistral.ai | mistral-large-2512 / mistral-medium-2508 | basic OpenAI-compatible usage
openrouter | https://openrouter.ai/api | /v1 | /api/ai/openrouter | https://openrouter.ai/api | anthropic/claude-opus-4-5 / anthropic/claude-sonnet-4-5 | openrouter plugins for search; adds Referer + X-Title in proxy
fireworks | https://api.fireworks.ai | /inference/v1 | /api/ai/fireworks | https://api.fireworks.ai | accounts/fireworks/models/kimi-k2p5 / llama4-maverick-instruct-basic | OpenAI-compatible (compatibility mode)
moonshot | https://api.moonshot.cn | /v1 | /api/ai/moonshot | https://api.moonshot.cn | kimi-k2.5 / kimi-k2.5 | OpenAI-compatible (compatibility mode)
cohere | https://api.cohere.ai | /v1 | /api/ai/cohere | https://api.cohere.ai | command-r-plus / command-r | OpenAI-compatible (compatibility mode); X-Client-Name header in proxy
together | https://api.together.xyz | /v1 | /api/ai/together | https://api.together.xyz | Llama-4 Maverick / Llama-4 Scout | OpenAI-compatible (compatibility mode)
groq | https://api.groq.com | /openai/v1 | /api/ai/groq | https://api.groq.com | llama-4-maverick / llama-4-scout | OpenAI-compatible (compatibility mode)
perplexity | https://api.perplexity.ai | / | /api/ai/perplexity | https://api.perplexity.ai | sonar-reasoning-pro / sonar | OpenAI-compatible (compatibility mode)
ollama | http://localhost:11434 | /api | /api/ai/ollama | http://localhost:11434 | llama4:maverick / llama4:scout | no API key required

Search providers:

Provider | Client base URL (local) | Proxy path | Proxy upstream base | Status
--- | --- | --- | --- | ---
tavily | https://api.tavily.com | /api/search/tavily | https://api.tavily.com | Implemented
firecrawl | https://api.firecrawl.dev | /api/search/firecrawl | https://api.firecrawl.dev | Implemented
exa | https://api.exa.ai | /api/search/exa | https://api.exa.ai | Implemented
bocha | https://api.bochaai.com | /api/search/bocha | N/A | Missing proxy route
searxng | http://localhost:8080 | /api/search/searxng | N/A | Missing proxy route

## Findings (Issues + Risks)

1) Missing proxy routes for search providers bocha and searxng
- Evidence: `useWebSearch.ts` supports bocha and searxng and switches to proxy mode paths `/api/search/bocha` and `/api/search/searxng`, but only tavily/firecrawl/exa proxy routes exist under `src/app/api/search/`.
- Impact: In proxy mode, selecting bocha or searxng will 404 and break search flows.
- References: `src/hooks/useWebSearch.ts`, `src/app/api/search/`.

2) OpenAI Responses API routing mismatch for models outside requiresResponsesAPI()
- Evidence: `filterModelSettings()` uses `usesOpenAIResponsesAPI()` (includes `gpt-4.1`, `gpt-5.2-mini`, `gpt-5.2-nano`, etc.) while `createAIProvider()` switches to Responses API only for models that pass `requiresResponsesAPI()` (o1/o3/gpt-5.2/gpt-5). This means models like `gpt-4.1` or `gpt-5.2-mini` will be routed to Chat Completions in the AI SDK path despite being flagged as Responses API in the settings filter.
- Impact: Those models may fail or behave inconsistently, especially for tool use and parameter support.
- References: `src/utils/deep-research/provider.ts`, `src/utils/openai-models.ts`, `src/utils/openai-responses-provider.ts`.

3) Legacy provider adapters are incomplete vs supported provider list
- Evidence: `createProvider()` in `src/utils/api/index.ts` only supports openai/anthropic/google/deepseek/ollama/openrouter/mistral/xai. Providers defined in settings and routing (fireworks, moonshot, cohere, together, groq, perplexity) are missing.
- Impact: Any code path using `createProvider()` will throw for those providers. This path appears mostly test-only right now, but it is a latent integration hazard.
- References: `src/utils/api/index.ts`, `src/store/setting.ts`.

4) Mixed integration paths for the same provider family
- Evidence: Core research path uses `createAIProvider()` in `src/utils/deep-research/provider.ts`, while legacy providers in `src/utils/api/*` use older SDK patterns (e.g., `.completion()` usage). Only one path appears active in current hooks, but both exist and diverge.
- Impact: Inconsistency and drift can introduce subtle breakage if older path is accidentally used or reactivated.
- References: `src/utils/deep-research/provider.ts`, `src/utils/api/*`.

5) Health-check endpoint reports unavailable
- Evidence: GET `http://127.0.0.1:3000/api/health-check` returned HTTP 503 while `/api/health` returned HTTP 200 with a healthy payload.
- Impact: Any uptime monitors or dependency checks targeting `/api/health-check` will fail; suggests downstream dependency failure or misconfigured handler.

## Suggested Next Steps (Fix Plan Seeds)

1) Add proxy routes for bocha and searxng (or disable them in proxy mode).
2) Align OpenAI model routing logic: either expand `requiresResponsesAPI()` or reuse `usesOpenAIResponsesAPI()` for routing.
3) Decide whether to remove or upgrade `src/utils/api/*` adapters; if kept, extend `createProvider()` to support all providers in settings.
4) Add minimal integration tests that validate proxy paths for all providers (schema-level checks, no paid calls).

## Evidence Snippets (File References)

- Search provider switches: `src/hooks/useWebSearch.ts`
- Missing search proxy routes: `src/app/api/search/`
- OpenAI routing mismatch: `src/utils/openai-models.ts`, `src/utils/openai-responses-provider.ts`, `src/utils/deep-research/provider.ts`
- Legacy provider coverage: `src/utils/api/index.ts`
