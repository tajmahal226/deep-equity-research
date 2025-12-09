import type { NextConfig } from "next";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pkg = require("./package.json") as typeof import("./package.json");

// AI provider API base url
const API_PROXY_BASE_URL = process.env.API_PROXY_BASE_URL || "";
const GOOGLE_GENERATIVE_AI_API_BASE_URL =
  process.env.GOOGLE_GENERATIVE_AI_API_BASE_URL ||
  "https://generativelanguage.googleapis.com";
const OPENROUTER_API_BASE_URL =
  process.env.OPENROUTER_API_BASE_URL || "https://openrouter.ai/api";
const OPENAI_API_BASE_URL =
  process.env.OPENAI_API_BASE_URL || "https://api.openai.com";
const ANTHROPIC_API_BASE_URL =
  process.env.ANTHROPIC_API_BASE_URL || "https://api.anthropic.com";
const DEEPSEEK_API_BASE_URL =
  process.env.DEEPSEEK_API_BASE_URL || "https://api.deepseek.com";
const XAI_API_BASE_URL = process.env.XAI_API_BASE_URL || "https://api.x.ai/v1";
const MISTRAL_API_BASE_URL =
  process.env.MISTRAL_API_BASE_URL || "https://api.mistral.ai";
const OLLAMA_API_BASE_URL =
  process.env.OLLAMA_API_BASE_URL || "http://0.0.0.0:11434";
// Search provider API base url
const TAVILY_API_BASE_URL =
  process.env.TAVILY_API_BASE_URL || "https://api.tavily.com";
const FIRECRAWL_API_BASE_URL =
  process.env.FIRECRAWL_API_BASE_URL || "https://api.firecrawl.dev";
const EXA_API_BASE_URL = process.env.EXA_API_BASE_URL || "https://api.exa.ai";
const BOCHA_API_BASE_URL =
  process.env.BOCHA_API_BASE_URL || "https://api.bochaai.com";
const SEARXNG_API_BASE_URL =
  process.env.SEARXNG_API_BASE_URL || "http://0.0.0.0:8080";

export default async function Config(phase: string) {
  const nextConfig: NextConfig = {
    /* config options here */
    env: {
      NEXT_PUBLIC_VERSION: pkg.version,
    },
    transpilePackages: ["pdfjs-dist", "mermaid"],
    output: 'standalone', // Enable standalone output for Docker
  };

  nextConfig.rewrites = async () => {
    return [
        {
          source: "/api/ai/google/:path*",
          destination: `${
            GOOGLE_GENERATIVE_AI_API_BASE_URL || API_PROXY_BASE_URL
          }/:path*`,
        },
        {
          source: "/api/ai/openrouter/:path*",
          destination: `${OPENROUTER_API_BASE_URL}/:path*`,
        },
        {
          source: "/api/ai/openai/:path*",
          destination: `${OPENAI_API_BASE_URL}/:path*`,
        },
        {
          source: "/api/ai/anthropic/:path*",
          destination: `${ANTHROPIC_API_BASE_URL}/:path*`,
        },
        {
          source: "/api/ai/deepseek/:path*",
          destination: `${DEEPSEEK_API_BASE_URL}/:path*`,
        },
        {
          source: "/api/ai/xai/:path*",
          destination: `${XAI_API_BASE_URL}/:path*`,
        },
        {
          source: "/api/ai/mistral/:path*",
          destination: `${MISTRAL_API_BASE_URL}/:path*`,
        },
        {
          source: "/api/ai/ollama/:path*",
          destination: `${OLLAMA_API_BASE_URL}/:path*`,
        },
        {
          source: "/api/search/tavily/:path*",
          destination: `${TAVILY_API_BASE_URL}/:path*`,
        },
        {
          source: "/api/search/firecrawl/:path*",
          destination: `${FIRECRAWL_API_BASE_URL}/:path*`,
        },
        {
          source: "/api/search/exa/:path*",
          destination: `${EXA_API_BASE_URL}/:path*`,
        },
        {
          source: "/api/search/bocha/:path*",
          destination: `${BOCHA_API_BASE_URL}/:path*`,
        },
        {
          source: "/api/search/searxng/:path*",
          destination: `${SEARXNG_API_BASE_URL}/:path*`,
        },
    ];
  };

  return nextConfig;
}
