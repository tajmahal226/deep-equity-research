<div align="center">
<h1>TJ Deep Research</h1>

</div>

**Deep Equity Research Analyst**

based off of https://github.com/u14app/deep-research

Deep Research uses a variety of powerful AI models to generate in-depth research reports in just a few minutes. It leverages advanced "Thinking" and "Task" models, combined with an internet connection, to provide fast and insightful analysis on a variety of topics. *All data is processed and stored locally in the browser.*

## Features
- Rapid deep research using thinking and reasoning models with web search
- Supports multiple AI and search providers (OpenAI and Tavily recommended)

## Installation
1. **Requirements**
   - [Node.js](https://nodejs.org/) (version 18.18.0 LTS or later recommended)
   - [pnpm](https://pnpm.io/) (preferred) or [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
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

## Contributing
1. Fork the repository and create a feature branch.
2. Install dependencies and ensure the development server runs.
3. Run linting before committing:
   ```bash
   pnpm lint
   ```
4. Submit a pull request describing your changes.

## Testing
Run the project lint checks:
```bash
pnpm lint
```

## Deployment Tips
- **Vercel**: configure environment variables in project settings. To opt into the experimental React Compiler, set `REACT_COMPILER=true`.
- **Docker/Standalone**: build with `pnpm build:standalone` and run the resulting image.
- **Static Hosting**: generate static export with `pnpm build:export`.

