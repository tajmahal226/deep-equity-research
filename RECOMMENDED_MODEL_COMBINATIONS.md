# Recommended Model Combinations by Provider

## Overview
Each research task uses two models:
- **Thinking Model**: For planning, reasoning, and analysis (higher capability)
- **Task Model**: For execution, searches, and content generation (faster/cheaper)

## Provider Recommendations

### 🟢 OpenAI (100% Compatibility)
**Most Powerful Configuration**
- **Thinking Model**: `gpt-5` or `o3-mini` (absolute best) or `o1` (excellent reasoning)
- **Task Model**: `gpt-5-turbo` or `gpt-5` or `gpt-4o`
- **Maximum Performance**: Use `gpt-5` for thinking, `gpt-5-turbo` for tasks
- **Next-Gen Power**: `o3` and `o3-mini` for advanced reasoning tasks

### 🟢 DeepSeek (100% Compatibility)
**Most Powerful Configuration**
- **Thinking Model**: `deepseek-reasoner` (rivals O1 performance)
- **Task Model**: `deepseek-chat` or `deepseek-coder` (for code-heavy research)
- **Maximum Performance**: Use `deepseek-reasoner` for thinking, `deepseek-chat` for tasks
- **Note**: DeepSeek Reasoner matches GPT-4/O1 level reasoning at 95% lower cost

### 🟢 xAI (100% Compatibility)
**Most Powerful Configuration**
- **Thinking Model**: `grok-3` or `grok-3-mini` (newest generation)
- **Task Model**: `grok-3` or `grok-2-1212`
- **Maximum Performance**: Use `grok-3` for both thinking and tasks
- **Note**: Grok-3 is xAI's latest model with enhanced reasoning and real-time capabilities

### 🟢 Mistral (100% Compatibility)
**Most Powerful Configuration**
- **Thinking Model**: `mistral-large-2411` or `mistral-large-latest` (128k context)
- **Task Model**: `mistral-large-latest` or `codestral-latest` (for code)
- **Maximum Performance**: Use `mistral-large-2411` for both
- **Code Research**: Use `codestral-2405` (specialized for code analysis)

### 🟡 Anthropic (88% Compatibility)
**Most Powerful Configuration**
- **Thinking Model**: `claude-opus-4-1-20250805` or `claude-sonnet-4-0-20250805` (latest generation)
- **Task Model**: `claude-sonnet-4-0-20250805` or `claude-3-5-sonnet-20241022`
- **Maximum Performance**: Use `claude-opus-4-1-20250805` for thinking, `claude-sonnet-4-0-20250805` for tasks
- **Note**: Opus 4.1 and Sonnet 4.0 are next-generation models with advanced capabilities

### 🟡 Google (75% Compatibility)
**Most Powerful Configuration**
- **Thinking Model**: `gemini-2.5-pro` or `gemini-2.5-flash-thinking` (latest models)
- **Task Model**: `gemini-2.5-pro` or `gemini-2.0-flash-exp`
- **Maximum Performance**: Use `gemini-2.5-flash-thinking` for reasoning, `gemini-2.5-pro` for tasks
- **Note**: Gemini 2.5 series represents Google's most advanced models to date

### 🔴 Groq (50% Compatibility)
**Most Powerful Configuration**
- **Thinking Model**: `llama-3.3-70b-versatile` (latest Llama model)
- **Task Model**: `llama-3.1-70b-versatile` or `mixtral-8x7b-32768`
- **Maximum Performance**: Use `llama-3.3-70b-versatile` for both
- **Note**: Groq offers fastest inference speeds - 10x faster than competitors

### 🔴 Cohere (50% Compatibility)
**Most Powerful Configuration**
- **Thinking Model**: `command-r-plus-08-2024` (104B parameters)
- **Task Model**: `command-r-plus-08-2024` or `command-r-08-2024`
- **Maximum Performance**: Use `command-r-plus-08-2024` for both
- **Note**: Command R+ excels at RAG and business analysis tasks

### 🔴 Together (50% Compatibility)
**Most Powerful Configuration**
- **Thinking Model**: `Qwen/QwQ-32B-Preview` (best reasoning) or `meta-llama/Llama-3.3-70B-Instruct-Turbo`
- **Task Model**: `meta-llama/Llama-3.3-70B-Instruct-Turbo` or `Qwen/Qwen2.5-72B-Instruct-Turbo`
- **Maximum Performance**: Use `Qwen/QwQ-32B-Preview` for thinking, `Llama-3.3-70B` for tasks
- **Note**: QwQ-32B matches O1-mini performance on reasoning tasks

### 🔴 Perplexity (50% Compatibility)
**Most Powerful Configuration**
- **Thinking Model**: `llama-3.1-sonar-huge-128k-online` (405B parameters with web)
- **Task Model**: `llama-3.1-sonar-large-128k-online`
- **Maximum Performance**: Use `llama-3.1-sonar-huge-128k-online` for both
- **Note**: Sonar models have built-in real-time web search - no separate search API needed

## Cost Optimization Tips

### Minimal Budget (<$10/month)
1. **DeepSeek**: `deepseek-chat` for both models
2. **Google**: `gemini-1.5-flash` for both (has free tier)
3. **OpenAI**: `gpt-3.5-turbo` for both

### Balanced Budget ($10-50/month)
1. **OpenAI**: `gpt-4o-mini` thinking, `gpt-3.5-turbo` tasks
2. **Anthropic**: `claude-3-5-haiku-20241022` for both
3. **Mistral**: `mistral-small-latest` for both

### Performance Priority ($50+/month)
1. **OpenAI**: `gpt-4o` thinking, `gpt-4o-mini` tasks
2. **Anthropic**: `claude-3-5-sonnet-20241022` thinking, `claude-3-5-haiku-20241022` tasks
3. **DeepSeek**: `deepseek-reasoner` thinking, `deepseek-chat` tasks

## Module-Specific Recommendations

### For Company Deep Dive (Intensive Research)
- **Best**: OpenAI `gpt-4o` or DeepSeek `deepseek-reasoner`
- **Budget**: DeepSeek `deepseek-chat`
- **Note**: This module is resource-intensive; use capable models

### For Financial Data (Simple Queries)
- Can use any model since these don't require complex reasoning
- Recommend cheapest available option

### For Free-Form Research (Flexible Queries)
- **Best**: Models with good general knowledge and reasoning
- **OpenAI**: `gpt-4o` or `gpt-4-turbo`
- **Anthropic**: `claude-3-5-sonnet-20241022`

### For Bulk Company Research (Multiple Companies)
- Use faster/cheaper models to manage costs
- **OpenAI**: `gpt-4o-mini`
- **Google**: `gemini-1.5-flash`
- **DeepSeek**: `deepseek-chat`

## Special Considerations

### Rate Limits
- **Groq**: Very high rate limits but limited daily tokens
- **OpenAI**: Tiered rate limits based on usage tier
- **Google**: Generous free tier, then pay-as-you-go

### Response Quality
- **Best Writing**: Anthropic Claude models
- **Best Reasoning**: OpenAI o1 models, DeepSeek Reasoner
- **Best Speed**: Groq, Google Gemini Flash
- **Best Value**: DeepSeek

### Regional Availability
- **Global**: OpenAI, Anthropic, DeepSeek
- **EU-Friendly**: Mistral (French company)
- **China**: DeepSeek (Chinese company, works globally)

## Maximum Performance Combinations

### "I want the absolute best reasoning"
- **Provider**: OpenAI
- **Models**: `gpt-5` or `o3` for thinking + `gpt-5-turbo` for tasks
- **Alternative**: DeepSeek with `deepseek-reasoner` + `deepseek-chat` (95% cheaper)

### "I want the best overall quality"
- **Provider**: Anthropic or OpenAI
- **Models**: `claude-opus-4-1-20250805` for both OR `gpt-5` for both

### "I want the best value with top performance"
- **Provider**: DeepSeek
- **Models**: `deepseek-reasoner` + `deepseek-chat` (GPT-4 level at 5% of cost)

### "I want the fastest with quality"
- **Provider**: Groq
- **Models**: `llama-3.3-70b-versatile` for both (10x faster inference)