# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the Deep Research project - a sophisticated AI-powered research assistant designed for public equity investment analysis.

## Project Overview

Deep Research is a comprehensive AI-powered research platform featuring:
- 8 different research modes for various analysis types
- 11+ AI provider integrations with unified interface
- Multi-stage research pipeline with real-time updates
- Knowledge graph generation and visualization
- Document processing and analysis capabilities
- Internationalization support

## Development Commands

### Install Dependencies
```bash
pnpm install  # Preferred (requires Node.js 22.x and npm 10+)
# or npm install
# or yarn install
```

### Development Server
```bash
pnpm dev  # Runs Next.js with Turbopack
```
Opens at http://localhost:3000

### Build Commands
```bash
# Standard build
pnpm build

# Standalone build (for Docker)
pnpm build:standalone

# Static export build (for static hosting)
pnpm build:export
```

### Production Server
```bash
pnpm start  # Requires build first
```

### Linting
```bash
pnpm lint  # Runs Next.js ESLint
```

## Architecture Overview

### Core Technology Stack
- **Framework**: Next.js 15.3.1 with App Router and Turbopack
- **Runtime**: React 19.1.0 with TypeScript (strict mode)
- **Styling**: Tailwind CSS + Shadcn UI components + HSL color system
- **State Management**: Zustand 5.0.3 stores with persistence in `/src/store`
- **AI Integration**: Multiple AI SDKs (@ai-sdk/*) with unified provider abstraction
- **Internationalization**: i18next with React integration
- **Markdown**: Multiple processors (marked, react-markdown, remark-gfm, rehype-highlight)
- **Diagrams**: Mermaid for knowledge graphs
- **Math**: KaTeX for mathematical expressions
- **Documents**: PDF.js for PDF parsing, office document support

### Key Architectural Patterns

#### 1. AI Provider Abstraction
The app supports 11+ AI providers through a unified interface:
- Each provider has its own API route in `/src/app/api/ai/[provider]`
- Provider configurations are managed through environment variables
- API routes are rewritten in `next.config.ts` to proxy requests
- Supports: OpenAI, Anthropic, Google, DeepSeek, xAI, Mistral, Ollama, and OpenRouter

#### 2. Research Flow Architecture
The research process follows a multi-stage pipeline:
1. **Thinking Phase**: AI generates research questions and plan
2. **Search Phase**: Multiple search providers gather information
3. **Analysis Phase**: AI processes and synthesizes findings
4. **Report Generation**: Final markdown report with citations

#### 3. Real-time Updates
- Server-Sent Events (SSE) API at `/api/sse` for streaming research progress
- Client-side event handling for real-time UI updates
- Support for both POST and GET methods for SSE
- Stream processing for AI responses with progress indicators

#### 4. Component Organization
- `/components/Internal`: Core reusable UI components
- `/components/Research`: Research-specific components
- `/components/ui`: Shadcn UI base components
- Components use compound pattern for complex features

#### 5. State Management
Zustand stores handle:
- **global.ts**: UI state (open/closed panels)
- **task.ts**: Main research task state with persistence
- **history.ts**: Research history management
- **knowledge.ts**: Knowledge base management
- **setting.ts**: User preferences and configuration
- **preFilledPrompts.ts**: Prompt template management

Features:
- Persistent stores using zustand/middleware
- Backup/restore functionality for tasks
- Atomic state updates

## Research Modes

The application supports 8 specialized research modes:

1. **Company Deep Dive**: Comprehensive company analysis with competitor research
2. **Bulk Company Research**: Research multiple companies simultaneously
3. **Market Research**: Industry and market analysis
4. **Free Form Research**: Open-ended research queries
5. **Company Discovery**: Find companies matching specific criteria
6. **Case Studies**: Research and analyze business case studies
7. **Doc Storage**: Document management and analysis
8. **Prompt Library**: Pre-configured research prompts

## Environment Configuration

Critical environment variables:
- `ACCESS_PASSWORD`: Protects server API endpoints
- `[PROVIDER]_API_KEY`: API keys for each AI provider
- `[PROVIDER]_API_BASE_URL`: Custom API endpoints
- `MCP_*`: Model Context Protocol server configuration
- `NEXT_PUBLIC_*`: Client-side feature flags

## API Integration Points

### Research APIs
- **SSE API** (`/api/sse`): Handles complete research workflow with streaming
- **Company Research** (`/api/company-research`): Dedicated company analysis
- **Bulk Research** (`/api/bulk-company-research`): Multiple company analysis
- **Crawler** (`/api/crawler`): Web crawling functionality

### MCP Server
- Endpoints: `/api/mcp` (HTTP) and `/api/mcp/sse` (SSE)
- Implements Model Context Protocol
- Requires specific environment configuration

### Search Providers
Each search provider has its own route and configuration:
- Tavily, Firecrawl, Exa, Bocha, SearXNG
- Model-based search (using AI provider's search capabilities)
- Configurable search depth (fast/medium/deep)

## Key Components

### Core UI Components
- **MagicDown**: Custom markdown editor/viewer with Mermaid support
- **Knowledge Graph**: Visual research findings using Mermaid diagrams
- **Search Area**: Multi-provider search interface
- **Artifact System**: Research output management
- **Upload Wrapper**: File upload and parsing (PDF, Office docs)
- **Lightbox**: Image viewing functionality
- **Resizable Panels**: Flexible UI layouts

### Layout Components
- **Header**: Global actions and navigation
- **Tab Interface**: 8 research mode tabs
- **Aside Panels**: Settings, History, Knowledge management
- **Footer**: Copyright and version info

## Deployment Considerations

### Build Modes
1. **Default**: Standard Next.js build with API routes
2. **Standalone**: Optimized for Docker deployment
3. **Export**: Static site generation (disables API routes)

### Platform-Specific
- **Vercel**: Use environment variables in dashboard
- **Cloudflare**: Follow docs for Pages deployment
- **Docker**: Use provided Dockerfile with environment variables

## Development Best Practices

### When Adding Features
1. Check existing patterns in similar components
2. Use TypeScript interfaces for all data structures
3. Implement proper error handling with user-friendly messages
4. Add translations to `/src/locales` for new UI text

### State Updates
- Use Zustand stores for global state
- Keep component state minimal
- Implement optimistic updates for better UX

### API Routes
- Validate inputs with proper error responses
- Use consistent error handling patterns
- Implement rate limiting where appropriate
- Check for ACCESS_PASSWORD when configured

### Performance
- Use dynamic imports for heavy components
- Implement proper loading states
- Optimize images and assets
- Use React.memo for expensive components

## Common Tasks

### Adding a New AI Provider
1. Create API route in `/src/app/api/ai/[provider]/[...slug]/route.ts`
2. Add provider configuration in environment variables
3. Update provider lists in constants
4. Add rewrite rules in `next.config.ts`

### Adding a New Search Provider
1. Create API route in `/src/app/api/search/[provider]/[...slug]/route.ts`
2. Implement search interface matching existing patterns
3. Add configuration and constants
4. Update UI components to include new provider

### Modifying Research Flow
1. Update prompts in `/src/constants/`
2. Modify SSE API logic in `/src/app/api/sse/route.ts`
3. Update client-side event handling
4. Test with multiple providers

### Adding a New Research Mode
1. Create new tab component in appropriate directory
2. Add tab to the main interface
3. Implement research logic and prompts
4. Add state management if needed
5. Update translations for UI text

## Special Features

### Company Research Capabilities
- Competitor analysis and comparison
- Industry/sub-industry categorization
- Custom research source specification
- Configurable research depth (1-15 minutes)
- Bulk company processing

### Knowledge Graph System
- Automatic generation from research reports
- Mermaid diagram visualization
- Editable in visual and code modes
- Export capabilities

### Document Processing
- PDF parsing with text extraction
- Office document support
- Automatic content analysis
- Integration with research workflow

## Debugging Tips

### Common Issues
- **CORS errors**: Check if using server proxy mode vs local mode
- **API failures**: Verify environment variables and API keys
- **Build errors**: Check build mode and dependencies
- **SSE connection issues**: Verify timeout settings and network
- **Provider errors**: Check API key rotation/polling configuration
- **Document parsing**: Verify file format support

### Useful Debugging Tools
- Browser DevTools Network tab for API calls
- React Developer Tools for component state
- Zustand DevTools for store inspection
- Console logs in SSE event handlers
- Research history for troubleshooting past runs