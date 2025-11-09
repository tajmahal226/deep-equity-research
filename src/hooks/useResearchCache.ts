/**
 * Research Cache Hook
 *
 * Provides caching functionality for research operations.
 * Automatically checks cache before making API calls and stores results.
 */

import { useCallback, useMemo } from "react";
import { useCacheStore, type CacheType } from "@/store/cache";
import { useSettingStore } from "@/store/setting";
import {
  buildCompanyResearchCacheKey,
  buildMarketResearchCacheKey,
  buildBulkCompanyResearchCacheKey,
  buildFreeFormResearchCacheKey,
  estimateCostSavings,
  estimateTokenSavings,
  isCacheable,
  formatLastUpdated,
  formatTimeRemaining,
  getCacheStatusColor,
} from "@/utils/cache-utils";

export interface ResearchCacheHookResult {
  // Cache operations
  getCachedResearch: (params: CacheKeyParams) => CachedResearchResult | null;
  setCachedResearch: (params: SetCacheParams) => void;
  invalidateCache: (params: CacheKeyParams) => void;

  // Cache info
  isCacheEnabled: boolean;
  getCacheMetadata: (params: CacheKeyParams) => CacheMetadata | null;

  // Analytics
  cacheStats: {
    totalHits: number;
    totalMisses: number;
    hitRate: number;
    estimatedSavings: string;
    estimatedTokenSavings: string;
  };

  // Configuration
  updateCacheConfig: (config: Partial<CacheConfig>) => void;
  clearCache: (type?: CacheType) => void;
  cleanupCache: () => number;
}

export interface CacheKeyParams {
  type: CacheType;
  companyName?: string;
  query?: string;
  companies?: string[];
  searchDepth?: string;
  provider?: string;
  model?: string;
  timeframe?: string;
  industry?: string;
  competitors?: string[];
  additionalContext?: string;
  searchProvider?: string;
}

export interface CachedResearchResult {
  report: string;
  sources?: any[];
  images?: string[];
  metadata?: Record<string, any>;
  cacheMetadata: {
    createdAt: number;
    lastAccessedAt: number;
    hitCount: number;
    expiresAt: number;
  };
}

export interface SetCacheParams extends CacheKeyParams {
  data: {
    report: string;
    sources?: any[];
    images?: string[];
    metadata?: Record<string, any>;
  };
}

export interface CacheMetadata {
  exists: boolean;
  isValid: boolean;
  lastUpdated: string;
  expiresIn: string;
  statusColor: "green" | "yellow" | "red";
  hitCount: number;
  canRefresh: boolean;
}

export interface CacheConfig {
  enabled: boolean;
  ttlHours: {
    companyResearch: number;
    marketResearch: number;
    bulkResearch: number;
    freeForm: number;
  };
  maxEntries: number;
  autoCleanup: boolean;
}

/**
 * Hook for managing research cache
 */
export function useResearchCache(): ResearchCacheHookResult {
  const cacheStore = useCacheStore();
  const settings = useSettingStore();

  // Check if cache is enabled
  const isCacheEnabled = useMemo(
    () => settings.cacheEnabled === "enable",
    [settings.cacheEnabled]
  );

  // Sync cache config with settings
  useMemo(() => {
    if (isCacheEnabled) {
      cacheStore.updateConfig({
        enabled: true,
        ttl: {
          "company-research": settings.cacheTTLCompanyResearch * 60 * 60 * 1000,
          "market-research": settings.cacheTTLMarketResearch * 60 * 60 * 1000,
          "bulk-company-research": settings.cacheTTLBulkResearch * 60 * 60 * 1000,
          "free-form-research": settings.cacheTTLFreeForm * 60 * 60 * 1000,
        },
        maxEntries: settings.cacheMaxEntries,
        autoCleanup: settings.cacheAutoCleanup === "enable",
      });
    }
  }, [
    isCacheEnabled,
    settings.cacheTTLCompanyResearch,
    settings.cacheTTLMarketResearch,
    settings.cacheTTLBulkResearch,
    settings.cacheTTLFreeForm,
    settings.cacheMaxEntries,
    settings.cacheAutoCleanup,
    cacheStore,
  ]);

  // Build cache key based on params
  const buildCacheKey = useCallback((params: CacheKeyParams): string => {
    switch (params.type) {
      case "company-research":
        return buildCompanyResearchCacheKey({
          companyName: params.companyName!,
          searchDepth: params.searchDepth || "medium",
          provider: params.provider,
          model: params.model,
          additionalContext: params.additionalContext,
          industry: params.industry,
          competitors: params.competitors,
        });

      case "market-research":
        return buildMarketResearchCacheKey({
          query: params.query!,
          timeframe: params.timeframe,
          provider: params.provider,
          model: params.model,
          industry: params.industry,
        });

      case "bulk-company-research":
        return buildBulkCompanyResearchCacheKey({
          companies: params.companies!,
          searchDepth: params.searchDepth || "medium",
          provider: params.provider,
          model: params.model,
        });

      case "free-form-research":
        return buildFreeFormResearchCacheKey({
          query: params.query!,
          provider: params.provider,
          model: params.model,
          searchProvider: params.searchProvider,
        });

      default:
        throw new Error(`Unknown cache type: ${params.type}`);
    }
  }, []);

  // Get cached research
  const getCachedResearch = useCallback(
    (params: CacheKeyParams): CachedResearchResult | null => {
      if (!isCacheEnabled) {
        return null;
      }

      // Check if this type of query is cacheable
      if (!isCacheable({ cacheType: params.type, query: params.query, searchDepth: params.searchDepth })) {
        return null;
      }

      const key = buildCacheKey(params);
      const entry = cacheStore.get(key);

      if (!entry) {
        cacheStore.recordMiss();
        return null;
      }

      // Record cache hit
      cacheStore.recordHit(key);

      // Calculate cost/token savings
      const costSavings = estimateCostSavings({
        provider: params.provider || "openai",
        cacheType: params.type,
        searchDepth: params.searchDepth,
      });

      const tokenSavings = estimateTokenSavings({
        cacheType: params.type,
        searchDepth: params.searchDepth,
      });

      // Update analytics
      cacheStore.updateStats({
        estimatedCostSavings: cacheStore.stats.estimatedCostSavings + costSavings,
        estimatedTokenSavings: cacheStore.stats.estimatedTokenSavings + tokenSavings,
      });

      return {
        ...entry.data,
        cacheMetadata: {
          createdAt: entry.createdAt,
          lastAccessedAt: entry.lastAccessedAt,
          hitCount: entry.hitCount,
          expiresAt: entry.expiresAt,
        },
      };
    },
    [isCacheEnabled, buildCacheKey, cacheStore]
  );

  // Set cached research
  const setCachedResearch = useCallback(
    (params: SetCacheParams): void => {
      if (!isCacheEnabled) {
        return;
      }

      // Check if this type of query is cacheable
      if (!isCacheable({ cacheType: params.type, query: params.query, searchDepth: params.searchDepth })) {
        return;
      }

      const key = buildCacheKey(params);
      const ttl = cacheStore.getTTL(params.type);

      cacheStore.set({
        type: params.type,
        key,
        data: params.data,
        ttl,
        requestParams: {
          query: params.query,
          companyName: params.companyName,
          searchDepth: params.searchDepth,
          provider: params.provider,
          model: params.model,
          timeframe: params.timeframe,
          industry: params.industry,
        },
      });
    },
    [isCacheEnabled, buildCacheKey, cacheStore]
  );

  // Invalidate cache entry
  const invalidateCache = useCallback(
    (params: CacheKeyParams): void => {
      const key = buildCacheKey(params);
      cacheStore.remove(key);
    },
    [buildCacheKey, cacheStore]
  );

  // Get cache metadata
  const getCacheMetadata = useCallback(
    (params: CacheKeyParams): CacheMetadata | null => {
      if (!isCacheEnabled) {
        return null;
      }

      const key = buildCacheKey(params);
      const entry = cacheStore.get(key);

      if (!entry) {
        return {
          exists: false,
          isValid: false,
          lastUpdated: "",
          expiresIn: "",
          statusColor: "red",
          hitCount: 0,
          canRefresh: false,
        };
      }

      const isValid = !cacheStore.isExpired(entry);

      return {
        exists: true,
        isValid,
        lastUpdated: formatLastUpdated(entry.createdAt),
        expiresIn: formatTimeRemaining(entry.expiresAt),
        statusColor: getCacheStatusColor(entry),
        hitCount: entry.hitCount,
        canRefresh: true,
      };
    },
    [isCacheEnabled, buildCacheKey, cacheStore]
  );

  // Cache statistics
  const cacheStats = useMemo(() => {
    const { totalHits, totalMisses, estimatedCostSavings, estimatedTokenSavings } = cacheStore.stats;
    const totalRequests = totalHits + totalMisses;
    const hitRate = totalRequests > 0 ? totalHits / totalRequests : 0;

    return {
      totalHits,
      totalMisses,
      hitRate,
      estimatedSavings: `$${estimatedCostSavings.toFixed(2)}`,
      estimatedTokenSavings: `${(estimatedTokenSavings / 1000).toFixed(1)}K`,
    };
  }, [cacheStore.stats]);

  // Update cache configuration
  const updateCacheConfig = useCallback(
    (config: Partial<CacheConfig>): void => {
      if (config.enabled !== undefined) {
        settings.update({ cacheEnabled: config.enabled ? "enable" : "disable" });
      }

      if (config.ttlHours) {
        settings.update({
          cacheTTLCompanyResearch: config.ttlHours.companyResearch,
          cacheTTLMarketResearch: config.ttlHours.marketResearch,
          cacheTTLBulkResearch: config.ttlHours.bulkResearch,
          cacheTTLFreeForm: config.ttlHours.freeForm,
        });
      }

      if (config.maxEntries !== undefined) {
        settings.update({ cacheMaxEntries: config.maxEntries });
      }

      if (config.autoCleanup !== undefined) {
        settings.update({ cacheAutoCleanup: config.autoCleanup ? "enable" : "disable" });
      }
    },
    [settings]
  );

  // Clear cache
  const clearCache = useCallback(
    (type?: CacheType): void => {
      cacheStore.clear(type);
    },
    [cacheStore]
  );

  // Cleanup expired entries
  const cleanupCache = useCallback((): number => {
    return cacheStore.cleanup();
  }, [cacheStore]);

  return {
    getCachedResearch,
    setCachedResearch,
    invalidateCache,
    isCacheEnabled,
    getCacheMetadata,
    cacheStats,
    updateCacheConfig,
    clearCache,
    cleanupCache,
  };
}
