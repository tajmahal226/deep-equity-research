/**
 * Research Cache Hook
 *
 * Provides caching functionality for research operations.
 * Automatically checks cache before making API calls and stores results.
 */

import { useCallback, useEffect, useMemo } from "react";
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

/**
 * Research Cache Hook Result interface.
 */
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

/**
 * Cache Key Params interface.
 */
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
 * Hook for managing research cache.
 * Provides methods to get, set, invalidate cache and get metadata.
 *
 * @returns Research cache utilities and state.
 */
export function useResearchCache(): ResearchCacheHookResult {
  const updateConfig = useCacheStore((state) => state.updateConfig);
  const getCacheEntry = useCacheStore((state) => state.get);
  const setCacheEntry = useCacheStore((state) => state.set);
  const removeCacheEntry = useCacheStore((state) => state.remove);
  const clearCacheEntries = useCacheStore((state) => state.clear);
  const cleanupCacheEntries = useCacheStore((state) => state.cleanup);
  const getTTL = useCacheStore((state) => state.getTTL);
  const recordHit = useCacheStore((state) => state.recordHit);
  const recordMiss = useCacheStore((state) => state.recordMiss);
  const updateStats = useCacheStore((state) => state.updateStats);
  const stats = useCacheStore((state) => state.stats);
  const isEntryExpired = useCacheStore((state) => state.isExpired);
  const config = useCacheStore((state) => state.config);

  const cacheEnabledSetting = useSettingStore((state) => state.cacheEnabled);
  const cacheTTLCompanyResearch = useSettingStore(
    (state) => state.cacheTTLCompanyResearch
  );
  const cacheTTLMarketResearch = useSettingStore(
    (state) => state.cacheTTLMarketResearch
  );
  const cacheTTLBulkResearch = useSettingStore(
    (state) => state.cacheTTLBulkResearch
  );
  const cacheTTLFreeForm = useSettingStore((state) => state.cacheTTLFreeForm);
  const cacheMaxEntries = useSettingStore((state) => state.cacheMaxEntries);
  const cacheAutoCleanupSetting = useSettingStore(
    (state) => state.cacheAutoCleanup
  );
  const updateSettings = useSettingStore((state) => state.update);

  // Check if cache is enabled
  const isCacheEnabled = useMemo(
    () => cacheEnabledSetting === "enable",
    [cacheEnabledSetting]
  );

  // Sync cache config with settings
  useEffect(() => {
    if (!isCacheEnabled) {
      return;
    }

    const companyTTL = cacheTTLCompanyResearch * 60 * 60 * 1000;
    const marketTTL = cacheTTLMarketResearch * 60 * 60 * 1000;
    const bulkTTL = cacheTTLBulkResearch * 60 * 60 * 1000;
    const freeFormTTL = cacheTTLFreeForm * 60 * 60 * 1000;
    const autoCleanupEnabled = cacheAutoCleanupSetting === "enable";

    const hasConfigChanged =
      !config.enabled ||
      config.maxEntries !== cacheMaxEntries ||
      config.autoCleanup !== autoCleanupEnabled ||
      config.ttl["company-research"] !== companyTTL ||
      config.ttl["market-research"] !== marketTTL ||
      config.ttl["bulk-company-research"] !== bulkTTL ||
      config.ttl["free-form-research"] !== freeFormTTL;

    if (hasConfigChanged) {
      updateConfig({
        enabled: true,
        ttl: {
          "company-research": companyTTL,
          "market-research": marketTTL,
          "bulk-company-research": bulkTTL,
          "free-form-research": freeFormTTL,
        },
        maxEntries: cacheMaxEntries,
        autoCleanup: autoCleanupEnabled,
      });
    }
  }, [
    isCacheEnabled,
    cacheTTLCompanyResearch,
    cacheTTLMarketResearch,
    cacheTTLBulkResearch,
    cacheTTLFreeForm,
    cacheMaxEntries,
    cacheAutoCleanupSetting,
    updateConfig,
    config,
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
      const entry = getCacheEntry(key);

      if (!entry) {
        recordMiss();
        return null;
      }

      // Record cache hit
      recordHit(key);

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
      updateStats({
        estimatedCostSavings: stats.estimatedCostSavings + costSavings,
        estimatedTokenSavings: stats.estimatedTokenSavings + tokenSavings,
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
    [
      isCacheEnabled,
      buildCacheKey,
      getCacheEntry,
      recordMiss,
      recordHit,
      updateStats,
      stats,
    ]
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
      const ttl = getTTL(params.type);

      setCacheEntry({
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
    [isCacheEnabled, buildCacheKey, getTTL, setCacheEntry]
  );

  // Invalidate cache entry
  const invalidateCache = useCallback(
    (params: CacheKeyParams): void => {
      const key = buildCacheKey(params);
      removeCacheEntry(key);
    },
    [buildCacheKey, removeCacheEntry]
  );

  // Get cache metadata
  const getCacheMetadata = useCallback(
    (params: CacheKeyParams): CacheMetadata | null => {
      if (!isCacheEnabled) {
        return null;
      }

      const key = buildCacheKey(params);
      const entry = getCacheEntry(key);

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

      const isValid = !isEntryExpired(entry);

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
    [isCacheEnabled, buildCacheKey, getCacheEntry, isEntryExpired]
  );

  // Cache statistics
  const cacheStats = useMemo(() => {
    const {
      totalHits,
      totalMisses,
      estimatedCostSavings,
      estimatedTokenSavings,
    } = stats;
    const totalRequests = totalHits + totalMisses;
    const hitRate = totalRequests > 0 ? totalHits / totalRequests : 0;

    return {
      totalHits,
      totalMisses,
      hitRate,
      estimatedSavings: `$${estimatedCostSavings.toFixed(2)}`,
      estimatedTokenSavings: `${(estimatedTokenSavings / 1000).toFixed(1)}K`,
    };
  }, [stats]);

  // Update cache configuration
  const updateCacheConfig = useCallback(
    (config: Partial<CacheConfig>): void => {
      if (config.enabled !== undefined) {
        updateSettings({ cacheEnabled: config.enabled ? "enable" : "disable" });
      }

      if (config.ttlHours) {
        updateSettings({
          cacheTTLCompanyResearch: config.ttlHours.companyResearch,
          cacheTTLMarketResearch: config.ttlHours.marketResearch,
          cacheTTLBulkResearch: config.ttlHours.bulkResearch,
          cacheTTLFreeForm: config.ttlHours.freeForm,
        });
      }

      if (config.maxEntries !== undefined) {
        updateSettings({ cacheMaxEntries: config.maxEntries });
      }

      if (config.autoCleanup !== undefined) {
        updateSettings({
          cacheAutoCleanup: config.autoCleanup ? "enable" : "disable",
        });
      }
    },
    [updateSettings]
  );

  // Clear cache
  const clearCache = useCallback(
    (type?: CacheType): void => {
      clearCacheEntries(type);
    },
    [clearCacheEntries]
  );

  // Cleanup expired entries
  const cleanupCache = useCallback((): number => {
    return cleanupCacheEntries();
  }, [cleanupCacheEntries]);

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
