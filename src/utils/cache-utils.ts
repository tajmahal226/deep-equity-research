/**
 * Cache Utility Functions
 *
 * Helper functions for cache key generation, cost estimation, and analytics
 */

import type { CacheType } from "@/store/cache";

/**
 * Create a hash from a string
 * Simple hash function for generating cache IDs
 */
export function createHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Build cache key for company research
 */
export function buildCompanyResearchCacheKey(params: {
  companyName: string;
  searchDepth: string;
  provider?: string;
  model?: string;
  additionalContext?: string;
  industry?: string;
  competitors?: string[];
}): string {
  const parts = [
    "company",
    params.companyName.toLowerCase().trim(),
    params.searchDepth,
    params.provider || "default",
    params.model || "default",
  ];

  // Add optional context hash
  if (params.additionalContext) {
    parts.push(createHash(params.additionalContext));
  }

  // Add industry if specified
  if (params.industry) {
    parts.push(params.industry.toLowerCase().trim());
  }

  // Add competitors hash if specified
  if (params.competitors && params.competitors.length > 0) {
    const competitorsHash = createHash(params.competitors.sort().join(","));
    parts.push(competitorsHash);
  }

  return parts.join(":");
}

/**
 * Build cache key for market research
 */
export function buildMarketResearchCacheKey(params: {
  query: string;
  timeframe?: string;
  provider?: string;
  model?: string;
  industry?: string;
}): string {
  const parts = [
    "market",
    createHash(params.query.toLowerCase().trim()),
    params.timeframe || "current",
    params.provider || "default",
    params.model || "default",
  ];

  if (params.industry) {
    parts.push(params.industry.toLowerCase().trim());
  }

  return parts.join(":");
}

/**
 * Build cache key for bulk company research
 */
export function buildBulkCompanyResearchCacheKey(params: {
  companies: string[];
  searchDepth: string;
  provider?: string;
  model?: string;
}): string {
  // Sort companies to ensure consistent cache key
  const companiesHash = createHash(
    params.companies
      .map((c) => c.toLowerCase().trim())
      .sort()
      .join(",")
  );

  const parts = [
    "bulk",
    companiesHash,
    params.searchDepth,
    params.provider || "default",
    params.model || "default",
  ];

  return parts.join(":");
}

/**
 * Build cache key for free-form research
 */
export function buildFreeFormResearchCacheKey(params: {
  query: string;
  provider?: string;
  model?: string;
  searchProvider?: string;
}): string {
  const parts = [
    "freeform",
    createHash(params.query.toLowerCase().trim()),
    params.provider || "default",
    params.model || "default",
    params.searchProvider || "default",
  ];

  return parts.join(":");
}

/**
 * Estimate cost savings from cache hit
 * Based on typical API costs per provider
 */
export function estimateCostSavings(params: {
  provider: string;
  cacheType: CacheType;
  searchDepth?: string;
}): number {
  const { provider, cacheType, searchDepth } = params;

  // Base costs per research type (in USD)
  // These are rough estimates based on typical token usage
  const baseCosts: Record<CacheType, number> = {
    "company-research": 0.5, // ~$0.50 for a company deep dive
    "market-research": 0.3, // ~$0.30 for market research
    "bulk-company-research": 2.0, // ~$2.00 for bulk research
    "free-form-research": 0.2, // ~$0.20 for free-form research
  };

  // Depth multipliers for company research
  const depthMultipliers: Record<string, number> = {
    fast: 0.3, // Fast uses less tokens
    medium: 1.0, // Medium is baseline
    deep: 2.5, // Deep uses much more
  };

  // Provider cost multipliers (relative to baseline)
  const providerMultipliers: Record<string, number> = {
    openai: 1.0, // Baseline
    anthropic: 1.5, // Claude is more expensive
    google: 0.6, // Gemini is cheaper
    deepseek: 0.1, // Very cheap
    xai: 1.2,
    mistral: 0.8,
    fireworks: 1.0,
    moonshot: 1.0,
    cohere: 1.0,
    together: 0.5,
    groq: 0.3,
    perplexity: 1.0,
    ollama: 0.0, // Local is free
    openrouter: 1.0,
  };

  let cost = baseCosts[cacheType] || 0.2;

  // Apply depth multiplier
  if (searchDepth && depthMultipliers[searchDepth]) {
    cost *= depthMultipliers[searchDepth];
  }

  // Apply provider multiplier
  const multiplier = providerMultipliers[provider.toLowerCase()] || 1.0;
  cost *= multiplier;

  return cost;
}

/**
 * Estimate token savings from cache hit
 */
export function estimateTokenSavings(params: {
  cacheType: CacheType;
  searchDepth?: string;
}): number {
  const { cacheType, searchDepth } = params;

  // Base token estimates per research type
  const baseTokens: Record<CacheType, number> = {
    "company-research": 50000, // ~50k tokens for company deep dive
    "market-research": 30000, // ~30k tokens for market research
    "bulk-company-research": 200000, // ~200k tokens for bulk research
    "free-form-research": 20000, // ~20k tokens for free-form
  };

  // Depth multipliers
  const depthMultipliers: Record<string, number> = {
    fast: 0.3,
    medium: 1.0,
    deep: 2.5,
  };

  let tokens = baseTokens[cacheType] || 20000;

  // Apply depth multiplier
  if (searchDepth && depthMultipliers[searchDepth]) {
    tokens *= depthMultipliers[searchDepth];
  }

  return Math.round(tokens);
}

/**
 * Format time remaining until cache expiry
 */
export function formatTimeRemaining(expiresAt: number): string {
  const now = Date.now();
  const remaining = expiresAt - now;

  if (remaining <= 0) {
    return "Expired";
  }

  const minutes = Math.floor(remaining / (1000 * 60));
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Format last updated time
 */
export function formatLastUpdated(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else {
    return "Just now";
  }
}

/**
 * Check if research parameters are cacheable
 * Some queries should not be cached (e.g., real-time data requests)
 */
export function isCacheable(params: {
  cacheType: CacheType;
  query?: string;
  searchDepth?: string;
}): boolean {
  // Don't cache if query contains real-time indicators
  const realtimeKeywords = [
    "today",
    "now",
    "current",
    "latest",
    "real-time",
    "live",
    "breaking",
  ];

  if (params.query) {
    const lowerQuery = params.query.toLowerCase();
    const hasRealtimeKeyword = realtimeKeywords.some((keyword) =>
      lowerQuery.includes(keyword)
    );

    // If query has real-time keywords, only cache for short duration
    if (hasRealtimeKeyword && params.cacheType === "free-form-research") {
      return false; // Don't cache real-time queries
    }
  }

  return true;
}

/**
 * Get cache status color for UI
 */
export function getCacheStatusColor(entry: {
  createdAt: number;
  expiresAt: number;
}): "green" | "yellow" | "red" {
  const now = Date.now();
  const age = now - entry.createdAt;
  const ttl = entry.expiresAt - entry.createdAt;
  const agePercent = age / ttl;

  if (agePercent < 0.5) {
    return "green"; // Fresh
  } else if (agePercent < 0.8) {
    return "yellow"; // Getting old
  } else {
    return "red"; // Nearly expired
  }
}
