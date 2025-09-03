<div align="center">
<h1>TJ Deep Research</h1>
</div>

**Deep Equity Research Analyst**

Based on [u14app/deep-research](https://github.com/u14app/deep-research).

TJ Deep Research orchestrates advanced "Thinking" and "Task" AI models with live web search to generate in‑depth equity research reports within minutes. All processing and storage happen locally in the browser.

## Table of Contents
- [Features](#features)
- [Installation](#installation)
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

## Environment Setup
1. Copy the example environment file and fill in required keys:
   ```bash
   cp .env.example .env.local
   ```
2. Set API keys such as `OPENAI_API_KEY` and `TAVILY_API_KEY` in `.env.local` (or via project settings when deploying).
3. Optionally configure LLM base URLs or additional provider keys.

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

## Deployment Tips
- **Vercel**: configure environment variables in project settings. To opt into the experimental React Compiler, set `REACT_COMPILER=true`.
- **Docker/Standalone**: build with `pnpm build:standalone` and run the resulting image.
- **Static Hosting**: generate static export with `pnpm build:export`.

## License
This project is licensed under the [MIT License](./LICENSE).

