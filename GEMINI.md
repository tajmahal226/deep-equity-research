# TJ Deep Research - Project Overview

**TJ Deep Research** is a sophisticated equity research analyst tool powered by AI. It orchestrates "Thinking" and "Task" models alongside live web search to generate comprehensive financial reports. The application is built with Next.js and operates primarily in the browser, leveraging a "bring your own key" security model to minimize server costs and maximize user privacy.

## 🏗 Architecture & Tech Stack

-   **Framework:** Next.js 15 (App Router)
-   **Language:** TypeScript
-   **State Management:** Zustand (with persistence middleware)
-   **Styling:** Tailwind CSS, Radix UI, Lucide Icons
-   **AI Integration:** Vercel AI SDK (`@ai-sdk/*`) supporting OpenAI, Anthropic, DeepSeek, Google, etc.
-   **Testing:** Vitest (Unit/Integration), Playwright (E2E)
-   **Deployment:** Vercel (Standard), Railway (Recommended for long-running SSE operations)

## 🚀 Key Features

*   **Research Modes:** Specialized modes for Company Deep Dives, Market Research, Document Analysis, and more.
*   **Local Processing:** Research logic and storage happen client-side; API keys are stored in `localStorage`.
*   **AI Orchestration:** Combines reasoning models (for planning) with task models (for execution) and web search (Tavily, etc.).
*   **PDF/Markdown Support:** Capable of ingesting and analyzing uploaded documents.

## 🛠 Development Workflow

### Prerequisites
*   Node.js 22.x
*   pnpm (Package Manager)

### Core Commands

| Command | Description |
| :--- | :--- |
| `pnpm install` | Install dependencies |
| `pnpm dev` | Start the development server at `http://localhost:3000` |
| `pnpm build` | Build the application for production |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint checks |
| `pnpm test` | Run unit and integration tests via Vitest |
| `pnpm test:e2e` | Run end-to-end tests via Playwright |

### Configuration Files
*   **`package.json`**: Dependency management and script definitions.
*   **`tsconfig.json`**: TypeScript settings. Note the path alias `@/*` mapping to `./src/*`.
*   **`next.config.ts`**: Next.js specific configuration.
*   **`vitest.config.ts`**: Configuration for the Vitest runner.
*   **`playwright.config.ts`**: Configuration for E2E testing.
*   **`DEPLOYMENT.md`**: Detailed deployment guide and environment variable reference.

## 📂 Project Structure

*   **`src/app`**: Next.js App Router pages and API routes.
*   **`src/components`**: React components (UI, Providers, Internal logic).
*   **`src/store`**: Zustand stores (`task.ts` is the core research engine).
*   **`src/lib`**: Shared libraries and utilities.
*   **`src/utils`**: Helper functions for AI models, parsing, and data processing.
*   **`tests`**: Unit and integration tests.

## 🔐 Security & Environment

The application prioritizes a **User-Provided Key** model.
*   **`.env.local`**: Optional. Only used for server-side fallback keys or protecting the deployment via `ACCESS_PASSWORD`.
*   **Rate Limiting**: Configured via environment variables (e.g., `RATE_LIMIT_AI_PROXY`) to protect against abuse in hosted environments.
*   **Secrets**: API keys entered in the UI are strictly stored in the browser and never logged by the server.

## 📝 Usage

1.  Start the app (`pnpm dev`).
2.  Navigate to `Settings` (⚙️).
3.  Enter your API keys (e.g., OpenAI, Tavily).
4.  Select a research mode and start a query.
