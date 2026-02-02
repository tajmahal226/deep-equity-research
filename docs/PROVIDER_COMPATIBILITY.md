# AI Provider Compatibility Guide

This document provides comprehensive information about all supported AI providers, their interoperable models, and configuration requirements.

## Overview

The TJ Deep Research application supports **14 AI providers** through a unified interface. Each provider has been tested and validated for compatibility with the research workflows.

## Supported Providers

| Provider | Type | API Key Required | Base URL | Version Path |
|----------|------|------------------|----------|--------------|
| OpenAI | Primary | Yes | `https://api.openai.com` | `/v1` |
| Anthropic | Primary | Yes | `https://api.anthropic.com` | `/v1` |
| Google (Gemini) | Primary | Yes | `https://generativelanguage.googleapis.com` | `/v1beta` |
| DeepSeek | Primary | Yes | `https://api.deepseek.com` | `/v1` |
| xAI (Grok) | Primary | Yes | `https://api.x.ai` | `/v1` |
| Mistral | Secondary | Yes | `https://api.mistral.ai` | `/v1` |
| OpenRouter | Aggregator | Yes | `https://openrouter.ai/api` | `/v1` |
| Fireworks | Secondary | Yes | `https://api.fireworks.ai` | `/inference/v1` |
| Moonshot | Secondary | Yes | `https://api.moonshot.cn` | `/v1` |
| Cohere | Secondary | Yes | `https://api.cohere.ai` | `/v1` |
| Together AI | Secondary | Yes | `https://api.together.xyz` | `/v1` |
| Groq | Secondary | Yes | `https://api.groq.com` | `/openai/v1` |
| Perplexity | Secondary | Yes | `https://api.perplexity.ai` | `/` |
| Ollama | Local | No | `http://localhost:11434` | `/api` |

## Provider Details

### 1. OpenAI
**Default Models:**
- Thinking: `o3-mini`
- Task: `gpt-5`

**Compatible Models:**
- GPT-5 series: `gpt-5`, `gpt-5-mini`, `gpt-5-nano`
- GPT-4.1 series: `gpt-4.1`, `gpt-4.1-mini`, `gpt-4.1-nano`
- GPT-4o series: `gpt-4o`, `gpt-4o-mini`
- O1/O3 series: `o1`, `o1-mini`, `o3-mini` (reasoning models)

**Special Notes:**
- Reasoning models (O1/O3/GPT-5) use the OpenAI Responses API
- Temperature setting is automatically disabled for reasoning models

### 2. Anthropic
**Default Models:**
- Thinking: `claude-opus-4-5-20251101`
- Task: `claude-sonnet-4-5-20251101`

**Compatible Models:**
- Claude 4.5 series: `claude-opus-4-5-20251101`, `claude-sonnet-4-5-20251101`
- Claude 3.5 series: `claude-3-5-sonnet-20241022`, `claude-3-5-haiku-20241022`
- Claude 3 series: `claude-3-opus-20240229`, `claude-3-sonnet-20240229`, `claude-3-haiku-20240307`

**Special Notes:**
- Requires `anthropic-dangerous-direct-browser-access` header for browser access
- Temperature is capped at 1.0 (automatically adjusted)

### 3. Google (Gemini)
**Default Models:**
- Thinking: `gemini-3-flash-thinking`
- Task: `gemini-3-flash-preview`

**Compatible Models:**
- Gemini 3: `gemini-3-flash-preview`, `gemini-3-flash-thinking`
- Gemini 2: `gemini-2.0-flash-exp`, `gemini-2.0-flash-thinking-exp-1219`
- Gemini 1.5: `gemini-1.5-pro-latest`, `gemini-1.5-flash-latest`

### 4. DeepSeek
**Default Models:**
- Thinking: `deepseek-reasoner`
- Task: `deepseek-chat`

**Compatible Models:**
- `deepseek-reasoner` (reasoning model)
- `deepseek-chat` (general purpose)
- `deepseek-coder` (code generation)

### 5. xAI (Grok)
**Default Models:**
- Thinking: `grok-3`
- Task: `grok-3-mini`

**Compatible Models:**
- Grok 3: `grok-3`, `grok-3-mini`, `grok-3-fast`, `grok-3-mini-fast`
- Grok 2: `grok-2`, `grok-2-mini`, `grok-2-1212`, `grok-2-mini-1212`
- **Note:** Reasoning variants (with `-reasoning` suffix) are automatically mapped to base models

**Special Notes:**
- Uses a custom provider implementation to bypass AI SDK v1/v2 compatibility issues
- Reasoning models are mapped to non-reasoning equivalents for compatibility

### 6. Mistral
**Default Models:**
- Thinking: `mistral-large-latest`
- Task: `mistral-small-latest`

**Compatible Models:**
- `mistral-large-latest`
- `mistral-medium-latest`
- `mistral-small-latest`
- `mistral-tiny-latest`
- `mistral-embed` (embeddings)

### 7. OpenRouter
**Default Models:**
- Thinking: `anthropic/claude-opus-4-5-20251101`
- Task: `anthropic/claude-sonnet-4-5-20251101`

**Compatible Models:**
OpenRouter provides access to models from multiple providers using prefixed model IDs:
- Anthropic: `anthropic/claude-opus-4-5-20251101`, `anthropic/claude-sonnet-4-5-20251101`
- OpenAI: `openai/gpt-4o`, `openai/gpt-4o-mini`
- Google: `google/gemini-1.5-pro-latest`
- Meta: `meta-llama/llama-3.1-70b-instruct`
- And many more...

**Special Notes:**
- Supports 100+ models from various providers
- Extra body parameters are forwarded for provider-specific features

### 8. Fireworks
**Default Models:**
- Thinking: `accounts/fireworks/models/firefunction-v2`
- Task: `accounts/fireworks/models/firefunction-v2`

**Compatible Models:**
- Firefunction: `accounts/fireworks/models/firefunction-v2`
- Llama 3: `accounts/fireworks/models/llama-v3p1-70b-instruct`, `accounts/fireworks/models/llama-v3p1-8b-instruct`
- Mixtral: `accounts/fireworks/models/mixtral-8x22b-instruct`

### 9. Moonshot
**Default Models:**
- Thinking: `moonshot-v1-32k`
- Task: `moonshot-v1-8k`

**Compatible Models:**
- `moonshot-v1-32k`
- `moonshot-v1-8k`
- `moonshot-v1-128k`

### 10. Cohere
**Default Models:**
- Thinking: `command-r-plus`
- Task: `command-r`

**Compatible Models:**
- Command R: `command-r`, `command-r-plus`
- Command: `command`, `command-light`
- Generate: `generate` (legacy)

**Special Notes:**
- Uses OpenAI-compatible API for chat completions
- All Cohere models work with the same endpoint structure

### 11. Together AI
**Default Models:**
- Thinking: `meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo`
- Task: `meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo`

**Compatible Models:**
- Llama 3.1: `meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo`, `meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo`
- Llama 3: `meta-llama/Meta-Llama-3-70B-Instruct`, `meta-llama/Meta-Llama-3-8B-Instruct`
- Mixtral: `mistralai/Mixtral-8x22B-Instruct-v0.1`
- Qwen: `Qwen/Qwen2-72B-Instruct`

### 12. Groq
**Default Models:**
- Thinking: `llama-3.1-70b-versatile`
- Task: `llama-3.1-8b-instant`

**Compatible Models:**
- Llama 3.1: `llama-3.1-70b-versatile`, `llama-3.1-8b-instant`
- Llama 3: `llama3-70b-8192`, `llama3-8b-8192`
- Mixtral: `mixtral-8x7b-32768`
- Gemma: `gemma-7b-it`

**Special Notes:**
- Extremely fast inference speeds
- Good for real-time applications

### 13. Perplexity
**Default Models:**
- Thinking: `llama-3.1-sonar-large-128k-online`
- Task: `llama-3.1-sonar-small-128k-online`

**Compatible Models:**
- Sonar Online: `llama-3.1-sonar-large-128k-online`, `llama-3.1-sonar-small-128k-online`
- Sonar Chat: `llama-3.1-sonar-large-128k-chat`, `llama-3.1-sonar-small-128k-chat`

**Special Notes:**
- Provides citations with responses
- Models have internet search capability built-in

### 14. Ollama
**Default Models:**
- Thinking: `llama3.1:70b`
- Task: `llama3.1:8b`

**Compatible Models:**
Any model installed in your local Ollama instance:
- Llama 3.1: `llama3.1`, `llama3.1:70b`, `llama3.1:8b`
- Llama 3: `llama3`, `llama3:70b`
- Mistral: `mistral`, `mixtral`
- Phi: `phi3`
- Gemma: `gemma2`

**Special Notes:**
- No API key required (local deployment)
- Requires Ollama server running locally or accessible via proxy

## Environment Variables

For server-side API key injection in proxy mode, set these environment variables:

```bash
# Primary Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=...
DEEPSEEK_API_KEY=...
XAI_API_KEY=xai-...

# Secondary Providers
MISTRAL_API_KEY=...
FIREWORKS_API_KEY=...
MOONSHOT_API_KEY=...
COHERE_API_KEY=...
TOGETHER_API_KEY=...
GROQ_API_KEY=gsk_...
PERPLEXITY_API_KEY=pplx-...
OPENROUTER_API_KEY=sk-or-...

# Search Providers
TAVILY_API_KEY=tvly-...
FIRECRAWL_API_KEY=fc-...
EXA_API_KEY=...
BOCHA_API_KEY=...

# Security
ACCESS_PASSWORD=your-access-password
```

## Troubleshooting

### Common Issues

1. **"Unsupported Provider" Error**
   - Check that the provider name matches exactly (case-sensitive)
   - Verify the provider is listed in the `PROVIDER_CONFIG` in `useAiProvider.ts`

2. **"API key required" Error**
   - Ensure you've entered the API key in Settings
   - For proxy mode, ensure the environment variable is set server-side
   - Ollama is the only provider that doesn't require an API key

3. **Model Not Found Error**
   - Verify the model ID matches exactly what's shown in the provider's documentation
   - Some providers prefix models (e.g., OpenRouter uses `anthropic/claude-...`)
   - Check if the model has been deprecated

4. **Temperature/Parameter Errors**
   - Reasoning models (O1, O3, GPT-5, Grok-reasoning) don't support temperature
   - The app automatically strips incompatible parameters

5. **CORS Errors**
   - In "Local" mode, API calls are made directly from the browser
   - Some providers (Anthropic, Google) require special headers
   - Switch to "Proxy" mode or use a CORS proxy

### Provider-Specific Issues

**Anthropic:**
- Requires special header for browser access: `anthropic-dangerous-direct-browser-access: true`
- Temperature capped at 1.0

**xAI:**
- Reasoning models are automatically mapped to base models for compatibility
- Uses custom provider implementation to handle AI SDK v5 compatibility

**OpenRouter:**
- Base URL must end with `/api`
- Supports extra body parameters for provider-specific features

**Google:**
- Uses API key in `x-goog-api-key` header
- Some models have region restrictions

## Testing Provider Connectivity

To test if a provider is working:

1. Go to Settings → AI Provider
2. Select the provider
3. Enter your API key
4. The app will validate the key by fetching available models (if supported)
5. Try running a simple research query

## Adding Custom Models

You can add custom models via the `NEXT_PUBLIC_MODEL_LIST` environment variable:

```bash
NEXT_PUBLIC_MODEL_LIST=gpt-4o-custom,gpt-5-custom,claude-custom
```

Or in the settings UI, enter any valid model ID for your selected provider.

## Model Selection Strategy

**For Deep Research (Thinking Model):**
- Best: Claude Opus, GPT-5, Grok-3, DeepSeek Reasoner
- Good: Claude Sonnet, GPT-4o, Gemini Pro
- Budget: GPT-4o-mini, Claude Haiku

**For Web Search/Task Model:**
- Best: GPT-4o, Claude Sonnet, Grok-3-mini
- Good: Mistral Large, Llama 3.1 70B
- Budget: GPT-4o-mini, Llama 3.1 8B

**For Local/Private Use:**
- Ollama with Llama 3.1 70B or Mistral Large
