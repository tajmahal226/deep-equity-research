/**
 * Next.js Middleware for API Authentication and Proxying
 *
 * This middleware handles authentication and API key management for:
 * - 11+ AI providers (OpenAI, Anthropic, Google, DeepSeek, xAI, Mistral, etc.)
 * - 5+ search providers (Tavily, Firecrawl, Exa, Bocha, SearXNG)
 * - Special routes (SSE, MCP, crawler)
 *
 * Refactored to use provider-handler.ts for DRY principle
 */

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getCustomModelList } from "@/utils/model";
import { verifySignature } from "@/utils/signature";
import {
  ERRORS,
  createAIProviderHandler,
  createSearchProviderHandler,
} from "@/middleware/provider-handler";

const NODE_ENV = process.env.NODE_ENV;

const getEnvConfig = () => ({
  accessPassword: process.env.ACCESS_PASSWORD || "",
  googleGenerativeAIKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
  openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  deepSeekApiKey: process.env.DEEPSEEK_API_KEY || "",
  xaiApiKey: process.env.XAI_API_KEY || "",
  fireworksApiKey: process.env.FIREWORKS_API_KEY || "",
  moonshotApiKey: process.env.MOONSHOT_API_KEY || "",
  mistralApiKey: process.env.MISTRAL_API_KEY || "",
  tavilyApiKey: process.env.TAVILY_API_KEY || "",
  firecrawlApiKey: process.env.FIRECRAWL_API_KEY || "",
  exaApiKey: process.env.EXA_API_KEY || "",
  bochaApiKey: process.env.BOCHA_API_KEY || "",
  disabledAIProvider: process.env.NEXT_PUBLIC_DISABLED_AI_PROVIDER || "",
  disabledSearchProvider: process.env.NEXT_PUBLIC_DISABLED_SEARCH_PROVIDER || "",
  modelList: process.env.NEXT_PUBLIC_MODEL_LIST || "",
});

// Limit the middleware to paths starting with `/api/`
export const config = {
  matcher: "/api/:path*",
};

export async function middleware(request: NextRequest) {
  if (NODE_ENV === "production") console.debug(request);

  const {
    accessPassword,
    anthropicApiKey,
    bochaApiKey,
    deepSeekApiKey,
    disabledAIProvider,
    disabledSearchProvider,
    exaApiKey,
    firecrawlApiKey,
    googleGenerativeAIKey,
    fireworksApiKey,
    moonshotApiKey,
    mistralApiKey,
    modelList,
    openRouterApiKey,
    openaiApiKey,
    tavilyApiKey,
    xaiApiKey,
  } = getEnvConfig();

  // Read request body once to avoid multiple consumption issues
  let requestBody = null;
  let clonedRequest = request;
  if (request.method.toUpperCase() !== "GET") {
    try {
      const body = await request.text();
      requestBody = body ? JSON.parse(body) : {};
      // Create a new request with the body intact for downstream processing
      clonedRequest = new NextRequest(request.url, {
        method: request.method,
        headers: request.headers,
        body: body || undefined,
      });
    } catch (error) {
      console.error("Error parsing request body in middleware:", error);
      requestBody = {};
    }
  }

  const disabledAIProviders =
    disabledAIProvider.length > 0 ? disabledAIProvider.split(",") : [];
  const disabledSearchProviders =
    disabledSearchProvider.length > 0
      ? disabledSearchProvider.split(",")
      : [];

  // Model validation helpers
  const modelListConfig = modelList.length > 0 ? modelList.split(",") : [];
  const { availableModelList, disabledModelList } = getCustomModelList(modelListConfig);

  const hasDisabledGeminiModel = () => {
    if (request.method.toUpperCase() === "GET") return false;
    const isAvailableModel = availableModelList.some((availableModel) =>
      request.nextUrl.pathname.includes(`models/${availableModel}:`)
    );
    if (isAvailableModel) return false;
    if (disabledModelList.includes("all")) return true;
    return disabledModelList.some((disabledModel) =>
      request.nextUrl.pathname.includes(`models/${disabledModel}:`)
    );
  };

  const hasDisabledAIModel = (body: any = {}) => {
    if (request.method.toUpperCase() === "GET") return false;
    const { model = "" } = body;
    const isAvailableModel = availableModelList.some(
      (availableModel) => availableModel === model
    );
    if (isAvailableModel) return false;
    if (disabledModelList.includes("all")) return true;
    return disabledModelList.some((disabledModel) => disabledModel === model);
  };

  const pathname = request.nextUrl.pathname;

  // ============================================================
  // AI PROVIDER ROUTES
  // ============================================================

  // Google (Gemini) - uses x-goog-api-key header
  if (pathname.startsWith("/api/ai/google")) {
    const handler = createAIProviderHandler(
      "google",
      () => googleGenerativeAIKey,
      () => requestBody,
      hasDisabledGeminiModel
    );
    return handler(request, accessPassword, disabledAIProviders);
  }

  // Fireworks
  if (pathname.startsWith("/api/ai/fireworks")) {
    const handler = createAIProviderHandler(
      "fireworks",
      () => fireworksApiKey,
      () => requestBody,
      () => hasDisabledAIModel(requestBody)
    );
    return handler(request, accessPassword, disabledAIProviders);
  }

  // Moonshot
  if (pathname.startsWith("/api/ai/moonshot")) {
    const handler = createAIProviderHandler(
      "moonshot",
      () => moonshotApiKey,
      () => requestBody,
      () => hasDisabledAIModel(requestBody)
    );
    return handler(request, accessPassword, disabledAIProviders);
  }

  // OpenRouter
  if (pathname.startsWith("/api/ai/openrouter")) {
    const handler = createAIProviderHandler(
      "openrouter",
      () => openRouterApiKey,
      () => requestBody,
      () => hasDisabledAIModel(requestBody)
    );
    return handler(request, accessPassword, disabledAIProviders);
  }

  // OpenAI
  if (pathname.startsWith("/api/ai/openai")) {
    const handler = createAIProviderHandler(
      "openai",
      () => openaiApiKey,
      () => requestBody,
      () => hasDisabledAIModel(requestBody)
    );
    return handler(request, accessPassword, disabledAIProviders);
  }

  // Anthropic - uses x-api-key header
  if (pathname.startsWith("/api/ai/anthropic")) {
    const handler = createAIProviderHandler(
      "anthropic",
      () => anthropicApiKey,
      () => requestBody,
      () => hasDisabledAIModel(requestBody)
    );
    return handler(request, accessPassword, disabledAIProviders);
  }

  // DeepSeek
  if (pathname.startsWith("/api/ai/deepseek")) {
    const handler = createAIProviderHandler(
      "deepseek",
      () => deepSeekApiKey,
      () => requestBody,
      () => hasDisabledAIModel(requestBody)
    );
    return handler(request, accessPassword, disabledAIProviders);
  }

  // xAI (Grok)
  if (pathname.startsWith("/api/ai/xai")) {
    const handler = createAIProviderHandler(
      "xai",
      () => xaiApiKey,
      () => requestBody,
      () => hasDisabledAIModel(requestBody)
    );
    return handler(request, accessPassword, disabledAIProviders);
  }

  // Mistral
  if (pathname.startsWith("/api/ai/mistral")) {
    const handler = createAIProviderHandler(
      "mistral",
      () => mistralApiKey,
      () => requestBody,
      () => hasDisabledAIModel(requestBody)
    );
    return handler(request, accessPassword, disabledAIProviders);
  }

  // Ollama - no API key, just signature verification
  if (pathname.startsWith("/api/ai/ollama")) {
    const handler = createAIProviderHandler(
      "ollama",
      () => "", // No API key needed
      () => requestBody,
      () => hasDisabledAIModel(requestBody)
    );
    return handler(request, accessPassword, disabledAIProviders);
  }

  // ============================================================
  // SEARCH PROVIDER ROUTES
  // ============================================================

  // Tavily Search
  if (pathname.startsWith("/api/search/tavily")) {
    const handler = createSearchProviderHandler("tavily", () => tavilyApiKey);
    return handler(request, accessPassword, disabledSearchProviders);
  }

  // Firecrawl Search
  if (pathname.startsWith("/api/search/firecrawl")) {
    const handler = createSearchProviderHandler("firecrawl", () => firecrawlApiKey);
    return handler(request, accessPassword, disabledSearchProviders);
  }

  // Exa Search
  if (pathname.startsWith("/api/search/exa")) {
    const handler = createSearchProviderHandler("exa", () => exaApiKey);
    return handler(request, accessPassword, disabledSearchProviders);
  }

  // Bocha Search
  if (pathname.startsWith("/api/search/bocha")) {
    const handler = createSearchProviderHandler("bocha", () => bochaApiKey);
    return handler(request, accessPassword, disabledSearchProviders);
  }

  // SearXNG Search - no API key, just auth validation
  if (pathname.startsWith("/api/search/searxng")) {
    const handler = createSearchProviderHandler("searxng", () => "");
    return handler(request, accessPassword, disabledSearchProviders);
  }

  // ============================================================
  // SPECIAL ROUTES
  // ============================================================

  // Crawler API
  if (pathname.startsWith("/api/crawler")) {
    const authorization = request.headers.get("authorization") || "";
    if (
      request.method.toUpperCase() !== "POST" ||
      !verifySignature(authorization.substring(7), accessPassword, Date.now())
    ) {
      return NextResponse.json(
        { error: ERRORS.NO_PERMISSIONS },
        { status: 403 }
      );
    }
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(
      "Content-Type",
      request.headers.get("Content-Type") || "application/json"
    );
    requestHeaders.delete("Authorization");
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // SSE (Server-Sent Events) API
  if (pathname.startsWith("/api/sse")) {
    let authorization = request.headers.get("authorization") || "";
    if (authorization !== "") {
      authorization = authorization.substring(7);
    } else if (request.method.toUpperCase() === "GET") {
      authorization = request.nextUrl.searchParams.get("password") || "";
    }
    if (authorization !== accessPassword) {
      return NextResponse.json(
        { error: ERRORS.NO_PERMISSIONS },
        { status: 403 }
      );
    }
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(
      "Content-Type",
      request.headers.get("Content-Type") || "application/json"
    );
    requestHeaders.delete("Authorization");
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // MCP (Model Context Protocol) API
  if (pathname.startsWith("/api/mcp")) {
    const authorization = request.headers.get("authorization") || "";
    if (authorization.substring(7) !== accessPassword) {
      const responseHeaders = new Headers();
      responseHeaders.set("WWW-Authenticate", ERRORS.NO_PERMISSIONS.message);
      return NextResponse.json(
        {
          error: 401,
          error_description: ERRORS.NO_PERMISSIONS.message,
          error_uri: request.nextUrl,
        },
        { headers: responseHeaders, status: 401 }
      );
    }
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(
      "Content-Type",
      request.headers.get("Content-Type") || "application/json"
    );
    requestHeaders.delete("Authorization");
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // Default: pass through
  return NextResponse.next({
    request: clonedRequest,
  });
}
