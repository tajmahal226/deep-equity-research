/**
 * Provider Handler Utility for Middleware
 *
 * This module extracts the duplicated provider authentication logic
 * from the main middleware file into reusable, type-safe functions.
 */

import { NextRequest, NextResponse } from "next/server";
import { multiApiKeyPolling } from "@/utils/model";
import { verifySignature } from "@/utils/signature";

/**
 * Error response definitions
 */
export const ERRORS = {
  NO_PERMISSIONS: {
    code: 403,
    message: "No permissions",
    status: "FORBIDDEN",
  },
  NO_API_KEY: {
    code: 500,
    message: "The server does not have an API key.",
    status: "Internal Server Error",
  },
} as const;

/**
 * Authentication header types for different providers
 */
export type AuthHeaderType =
  | "authorization"      // Standard Bearer token
  | "x-api-key"          // Anthropic-style
  | "x-goog-api-key"     // Google-style
  | "none";              // No API key needed (e.g., Ollama)

/**
 * Provider configuration interface
 */
export interface ProviderConfig {
  /** Environment variable containing the API key(s) */
  apiKey: string;
  /** Provider ID for key rotation caching */
  providerName: string;
  /** How the API key is passed in headers */
  authHeaderType: AuthHeaderType;
  /** Whether to strip "Bearer " prefix from authorization header */
  stripBearerPrefix?: boolean;
  /** Custom headers to set on the proxied request */
  customHeaders?: Record<string, string>;
}

/**
 * Search provider configuration (extends ProviderConfig with method check)
 */
export interface SearchProviderConfig extends ProviderConfig {
  /** Whether to require POST method for search endpoints */
  requirePost?: boolean;
}

/**
 * Handle AI provider authentication and proxying
 *
 * @param request - The incoming request
 * @param config - Provider configuration
 * @param requestBody - Parsed request body (for model validation)
 * @param accessPassword - Access password for signature verification
 * @param disabledProviders - List of disabled provider IDs
 * @param isModelDisabled - Optional function to check if specific model is disabled
 * @returns NextResponse or null (null = allow request to proceed)
 */
export function handleAIProvider(
  request: NextRequest,
  config: ProviderConfig,
  requestBody: any,
  accessPassword: string,
  disabledProviders: string[],
  isModelDisabled?: () => boolean
): NextResponse | null {
  const { apiKey, providerName, authHeaderType, stripBearerPrefix = true, customHeaders = {} } = config;

  // Check if provider is disabled
  if (disabledProviders.includes(providerName)) {
    return NextResponse.json({ error: ERRORS.NO_PERMISSIONS }, { status: 403 });
  }

  // Check if specific model is disabled
  if (isModelDisabled && isModelDisabled()) {
    return NextResponse.json({ error: ERRORS.NO_PERMISSIONS }, { status: 403 });
  }

  // Extract and verify authorization
  const authHeader = request.headers.get(authHeaderType) || "";
  const signature = stripBearerPrefix && authHeaderType === "authorization"
    ? authHeader.substring(7)
    : authHeader;

  if (!verifySignature(signature, accessPassword, Date.now())) {
    return NextResponse.json({ error: ERRORS.NO_PERMISSIONS }, { status: 403 });
  }

  // For providers with "none" auth type (e.g., Ollama), skip API key check
  if (authHeaderType === "none") {
    return createProxyResponse(request, customHeaders);
  }

  // Get API key via rotation
  const selectedKey = multiApiKeyPolling(apiKey, providerName);
  if (!selectedKey) {
    return NextResponse.json({ error: ERRORS.NO_API_KEY }, { status: 500 });
  }

  // Set authorization header based on provider type
  const headers = { ...customHeaders };
  if (authHeaderType === "authorization") {
    headers["Authorization"] = `Bearer ${selectedKey}`;
  } else if (authHeaderType === "x-api-key") {
    headers["x-api-key"] = selectedKey;
    headers["anthropic-version"] = request.headers.get("anthropic-version") || "2023-06-01";
  } else if (authHeaderType === "x-goog-api-key") {
    headers["x-goog-api-key"] = selectedKey;
    headers["x-goog-api-client"] = request.headers.get("x-goog-api-client") || "genai-js/0.24.0";
  }

  return createProxyResponse(request, headers);
}

/**
 * Handle search provider authentication and proxying
 *
 * @param request - The incoming request
 * @param config - Search provider configuration
 * @param accessPassword - Access password for signature verification
 * @param disabledProviders - List of disabled provider IDs
 * @returns NextResponse or null
 */
export function handleSearchProvider(
  request: NextRequest,
  config: SearchProviderConfig,
  accessPassword: string,
  disabledProviders: string[]
): NextResponse | null {
  const { apiKey, providerName, requirePost = true } = config;

  // Check method if required
  if (requirePost && request.method.toUpperCase() !== "POST") {
    return NextResponse.json({ error: ERRORS.NO_PERMISSIONS }, { status: 403 });
  }

  // Check if provider is disabled
  if (disabledProviders.includes(providerName)) {
    return NextResponse.json({ error: ERRORS.NO_PERMISSIONS }, { status: 403 });
  }

  // Verify authorization
  const authHeader = request.headers.get("authorization") || "";
  const signature = authHeader.substring(7);

  if (!verifySignature(signature, accessPassword, Date.now())) {
    return NextResponse.json({ error: ERRORS.NO_PERMISSIONS }, { status: 403 });
  }

  // SearXNG doesn't need an API key, just auth validation
  if (providerName === "searxng") {
    const headers = new Headers(request.headers);
    headers.set("Content-Type", request.headers.get("Content-Type") || "application/json");
    headers.delete("Authorization");
    return NextResponse.next({ request: { headers } });
  }

  // Get API key for other search providers
  const selectedKey = multiApiKeyPolling(apiKey, providerName);
  if (!selectedKey) {
    return NextResponse.json({ error: ERRORS.NO_API_KEY }, { status: 500 });
  }

  const headers = new Headers(request.headers);
  headers.set("Content-Type", request.headers.get("Content-Type") || "application/json");
  headers.set("Authorization", `Bearer ${selectedKey}`);

  return NextResponse.next({ request: { headers } });
}

/**
 * Create a proxied response with custom headers
 */
function createProxyResponse(request: NextRequest, headers: Record<string, string>): NextResponse | null {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("Content-Type", request.headers.get("Content-Type") || "application/json");

  for (const [key, value] of Object.entries(headers)) {
    requestHeaders.set(key, value);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

/**
 * Provider configuration factory
 *
 * Creates provider configs with sensible defaults for common patterns
 */
export const createProviderConfig = (
  apiKey: string,
  providerName: string,
  authHeaderType: AuthHeaderType = "authorization"
): ProviderConfig => ({
  apiKey,
  providerName,
  authHeaderType,
  stripBearerPrefix: authHeaderType === "authorization",
});

/**
 * AI Provider registry with all provider-specific configurations
 *
 * This maps provider names to their authentication patterns,
 * making it easy to add new providers without duplicating code.
 */
export const AI_PROVIDER_REGISTRY: Record<string, (apiKey: string) => ProviderConfig> = {
  google: (apiKey) => createProviderConfig(apiKey, "google", "x-goog-api-key"),
  fireworks: (apiKey) => createProviderConfig(apiKey, "fireworks", "authorization"),
  moonshot: (apiKey) => createProviderConfig(apiKey, "moonshot", "authorization"),
  openrouter: (apiKey) => createProviderConfig(apiKey, "openrouter", "authorization"),
  openai: (apiKey) => createProviderConfig(apiKey, "openai", "authorization"),
  anthropic: (apiKey) => createProviderConfig(apiKey, "anthropic", "x-api-key"),
  deepseek: (apiKey) => createProviderConfig(apiKey, "deepseek", "authorization"),
  xai: (apiKey) => createProviderConfig(apiKey, "xai", "authorization"),
  mistral: (apiKey) => createProviderConfig(apiKey, "mistral", "authorization"),
  ollama: (apiKey) => createProviderConfig(apiKey, "ollama", "none"),
};

/**
 * Search provider registry
 */
export const SEARCH_PROVIDER_REGISTRY: Record<string, (apiKey: string) => SearchProviderConfig> = {
  tavily: (apiKey) => ({ ...createProviderConfig(apiKey, "tavily", "authorization"), requirePost: true }),
  firecrawl: (apiKey) => ({ ...createProviderConfig(apiKey, "firecrawl", "authorization"), requirePost: true }),
  exa: (apiKey) => ({ ...createProviderConfig(apiKey, "exa", "authorization"), requirePost: true }),
  bocha: (apiKey) => ({ ...createProviderConfig(apiKey, "bocha", "authorization"), requirePost: true }),
  searxng: (apiKey) => ({ ...createProviderConfig(apiKey, "searxng", "none"), requirePost: true }),
};

/**
 * Route handler factory for AI providers
 *
 * Creates a handler function for a specific AI provider route
 */
export function createAIProviderHandler(
  providerName: keyof typeof AI_PROVIDER_REGISTRY,
  getApiKey: () => string,
  getRequestBody: () => any,
  isModelDisabled?: () => boolean
) {
  return (
    request: NextRequest,
    accessPassword: string,
    disabledProviders: string[]
  ): NextResponse | null => {
    const configFn = AI_PROVIDER_REGISTRY[providerName];
    if (!configFn) {
      return NextResponse.json({ error: ERRORS.NO_PERMISSIONS }, { status: 403 });
    }

    const config = configFn(getApiKey());
    return handleAIProvider(request, config, getRequestBody(), accessPassword, disabledProviders, isModelDisabled);
  };
}

/**
 * Route handler factory for search providers
 */
export function createSearchProviderHandler(
  providerName: keyof typeof SEARCH_PROVIDER_REGISTRY,
  getApiKey: () => string
) {
  return (
    request: NextRequest,
    accessPassword: string,
    disabledProviders: string[]
  ): NextResponse | null => {
    const configFn = SEARCH_PROVIDER_REGISTRY[providerName];
    if (!configFn) {
      return NextResponse.json({ error: ERRORS.NO_PERMISSIONS }, { status: 403 });
    }

    const config = configFn(getApiKey());
    return handleSearchProvider(request, config, accessPassword, disabledProviders);
  };
}
