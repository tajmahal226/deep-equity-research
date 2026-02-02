<div align="center">
<h1>TJ Deep Research</h1>
</div>

**Deep Equity Research Analyst**

Based on [u14app/deep-research](https://github.com/u14app/deep-research).

TJ Deep Research orchestrates advanced "Thinking" and "Task" AI models with live web search to generate in‑depth equity research reports within minutes. All processing and storage happen locally in the browser.

## Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Running Research Modes](#running-research-modes)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Testing](#testing)
- [Deployment Tips](#deployment-tips)
- [License](#license)

## Features
- Rapid deep research using thinking and reasoning models with web search
- Supports multiple AI and search providers (OpenAI and Tavily recommended)
- UI modes for company deep dives, market research, document analysis, and more
- All research runs locally in your browser
- **User-provided API keys** - bring your own keys, no server-side costs

## Installation
1. **Clone the repository**
   ```bash
   git clone https://github.com/tajmahal226/deep-equity-research.git
   cd deep-equity-research
   ```
2. **Install dependencies**
   ```bash
   pnpm install
   ```

## Getting Started

### For Users (Quickstart)

This app requires you to provide your own API keys via the Settings UI. 

1. **Start the dev server:**
   ```bash
   pnpm dev
   ```
   
2. **Open the app:** Navigate to [http://localhost:3000](http://localhost:3000)

3. **Configure your API keys:**
   - Click the **Settings icon (⚙️)** in the top right
   - Go to **AI Providers** tab
   - Choose a provider (OpenAI recommended)
   - Enter your API key
   - Go to **Search Providers** tab
   - Choose a search provider (Tavily recommended) 
   - Enter your search API key

4. **Start researching!** Choose a research mode and enter your query.

**Don't have API keys?**
- OpenAI: [Get API key](https://platform.openai.com/api-keys)
- Tavily: [Get API key](https://tavily.com/)
- See [AI_MODELS_GUIDE.md](./AI_MODELS_GUIDE.md) for all supported providers

## Environment Setup

### For Regular Use
**No `.env.local` file needed!** Users provide their API keys through the Settings UI.

### For Deployment (Optional)
Server-side API keys in `.env.local` are **optional** and only needed for:
- **MCP server integration** with Claude Desktop (requires `MCP_*` environment variables)
- **Demo/testing instances** where you want to provide fallback keys
- **Single-user deployments** where you control all access

**For multi-user deployments:** Do NOT set server-side API keys. Let each user provide their own.

If you do want server-side keys:
1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
2. Configure optional API keys and settings in `.env.local`
3. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed configuration

## Running Research Modes
Start the development server:
```bash
pnpm dev
```
Then open [http://localhost:3000](http://localhost:3000) and choose a mode from the UI:

- **Company Deep Dive** – comprehensive company analysis
- **Bulk Company Research** – analyze multiple companies at once
- **Market Research** – industry and market insights
- **Free Form Research** – open-ended queries
- **Company Discovery** – find companies by criteria
- **Case Studies** – analyze business case studies
- **Doc Storage** – upload and explore documents
- **Prompt Library** – run pre-configured prompts

For production builds:
```bash
pnpm build
pnpm start
```

## Documentation
Additional usage notes and API details can be found in the [docs](./docs) directory, including [API documentation](./docs/deep-research-api-doc.md).

## Contributing
1. Fork the repository and create a feature branch.
2. Install dependencies and ensure the development server runs.
3. Run linting and tests before committing:
   ```bash
   pnpm lint
   pnpm test
   ```
4. Submit a pull request describing your changes.

## Testing
Run project checks locally:
```bash
pnpm lint
pnpm test
```

## Deployment

### Recommended: Railway ⭐

**Railway is recommended for this app** because it supports long-running Server-Sent Events (SSE) connections required for AI research operations that can take 3-10 minutes. Vercel's serverless functions timeout at 60 seconds.

👉 **See [RAILWAY.md](./RAILWAY.md) for step-by-step Railway deployment guide**

### Other Platforms

| Platform | SSE Support | Notes |
|----------|-------------|-------|
| **Railway** ✅ | Full (15+ min) | **Recommended** for this app |
| **Vercel** | 60 seconds | Will timeout on deep research |
| **Render** | Full (15+ min) | Good alternative |
| **Fly.io** | Full | Good alternative |
| **Docker/VPS** | Full | Full control |

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions and security model.

## License
This project is licensed under the [MIT License](./LICENSE).
# Force rebuild Mon Feb  2 10:50:28 EST 2026
# Cache bust 1770061850
