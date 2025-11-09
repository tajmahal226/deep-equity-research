/**
 * Research Cache Store
 *
 * Implements intelligent caching for research results to:
 * - Reduce API costs by avoiding duplicate research
 * - Speed up repeated queries
 * - Track cache analytics (hits/misses, savings)
 * - Support configurable TTL (time-to-live) per cache type
 */

import { create } from "zustand";
import { persist, type StorageValue } from "zustand/middleware";
import { researchCacheStorage } from "@/utils/storage";
import { pick } from "radash";
import { createHash } from "@/utils/cache-utils";

// Cache entry types
export type CacheType =
  | "company-research"
  | "market-research"
  | "bulk-company-research"
  | "free-form-research";

// Individual cache entry
export interface CacheEntry {
  id: string;
  type: CacheType;
  key: string; // Composite cache key

  // Research data
  data: {
    report: string;
    sources?: any[];
    images?: string[];
    metadata?: Record<string, any>;
  };

  // Cache metadata
  createdAt: number;
  expiresAt: number;
  ttl: number; // Time to live in milliseconds

  // Original request parameters (for debugging/display)
  requestParams: {
    query?: string;
    companyName?: string;
    searchDepth?: string;
    provider?: string;
    model?: string;
    [key: string]: any;
  };

  // Analytics
  hitCount: number; // Number of times this cache was used
  lastAccessedAt: number;
}

// Cache statistics
export interface CacheStats {
  totalHits: number;
  totalMisses: number;
  totalEntries: number;
  estimatedCostSavings: number; // In USD
  estimatedTokenSavings: number;
  lastUpdated: number;
}

// Cache configuration
export interface CacheConfig {
  enabled: boolean;

  // TTL in milliseconds for each cache type
  ttl: {
    "company-research": number; // Default: 24 hours
    "market-research": number; // Default: 12 hours
    "bulk-company-research": number; // Default: 24 hours
    "free-form-research": number; // Default: 6 hours
  };

  // Maximum cache size (number of entries)
  maxEntries: number; // Default: 500

  // Auto-cleanup: remove expired entries on load
  autoCleanup: boolean; // Default: true
}

// Store state
export interface CacheStore {
  entries: CacheEntry[];
  stats: CacheStats;
  config: CacheConfig;
}

// Store functions
export interface CacheFunction {
  // Cache operations
  get: (key: string) => CacheEntry | null;
  set: (entry: Omit<CacheEntry, "id" | "createdAt" | "expiresAt" | "hitCount" | "lastAccessedAt">) => string;
  remove: (key: string) => boolean;
  clear: (type?: CacheType) => void;

  // Cache management
  cleanup: () => number; // Remove expired entries, returns count removed
  prune: () => number; // Remove oldest entries if over maxEntries, returns count removed

  // Analytics
  recordHit: (key: string) => void;
  recordMiss: () => void;
  updateStats: (partial: Partial<CacheStats>) => void;
  resetStats: () => void;

  // Configuration
  updateConfig: (partial: Partial<CacheConfig>) => void;
  getTTL: (type: CacheType) => number;

  // Utilities
  isExpired: (entry: CacheEntry) => boolean;
  getValidEntries: () => CacheEntry[];
  getCacheInfo: () => {
    totalSize: number;
    validEntries: number;
    expiredEntries: number;
    hitRate: number;
  };
}

// Default configuration
const defaultConfig: CacheConfig = {
  enabled: true,
  ttl: {
    "company-research": 24 * 60 * 60 * 1000, // 24 hours
    "market-research": 12 * 60 * 60 * 1000, // 12 hours
    "bulk-company-research": 24 * 60 * 60 * 1000, // 24 hours
    "free-form-research": 6 * 60 * 60 * 1000, // 6 hours
  },
  maxEntries: 500,
  autoCleanup: true,
};

const defaultStats: CacheStats = {
  totalHits: 0,
  totalMisses: 0,
  totalEntries: 0,
  estimatedCostSavings: 0,
  estimatedTokenSavings: 0,
  lastUpdated: Date.now(),
};

export const useCacheStore = create(
  persist<CacheStore & CacheFunction>(
    (set, get) => ({
      entries: [],
      stats: defaultStats,
      config: defaultConfig,

      // Get cache entry by key
      get: (key: string) => {
        const entry = get().entries.find((e) => e.key === key);

        if (!entry) {
          return null;
        }

        // Check if expired
        if (get().isExpired(entry)) {
          // Remove expired entry
          get().remove(key);
          return null;
        }

        return entry;
      },

      // Set cache entry
      set: (entryData) => {
        const { config } = get();
        const now = Date.now();
        const ttl = entryData.ttl || config.ttl[entryData.type];

        const newEntry: CacheEntry = {
          ...entryData,
          id: createHash(entryData.key),
          createdAt: now,
          expiresAt: now + ttl,
          hitCount: 0,
          lastAccessedAt: now,
        };

        set((state) => {
          // Remove existing entry with same key
          const filtered = state.entries.filter((e) => e.key !== entryData.key);

          // Add new entry
          const updated = [newEntry, ...filtered];

          // Update stats
          const newStats = {
            ...state.stats,
            totalEntries: updated.length,
            lastUpdated: now,
          };

          return {
            entries: updated,
            stats: newStats,
          };
        });

        // Auto-prune if over max entries
        const currentEntries = get().entries.length;
        if (currentEntries > config.maxEntries) {
          get().prune();
        }

        return newEntry.id;
      },

      // Remove cache entry
      remove: (key: string) => {
        const before = get().entries.length;

        set((state) => ({
          entries: state.entries.filter((e) => e.key !== key),
        }));

        const after = get().entries.length;

        // Update stats
        if (before !== after) {
          set((state) => ({
            stats: {
              ...state.stats,
              totalEntries: after,
              lastUpdated: Date.now(),
            },
          }));
        }

        return before !== after;
      },

      // Clear all or specific type
      clear: (type?: CacheType) => {
        set((state) => {
          const filtered = type
            ? state.entries.filter((e) => e.type !== type)
            : [];

          return {
            entries: filtered,
            stats: {
              ...state.stats,
              totalEntries: filtered.length,
              lastUpdated: Date.now(),
            },
          };
        });
      },

      // Cleanup expired entries
      cleanup: () => {
        const before = get().entries.length;
        const now = Date.now();

        set((state) => ({
          entries: state.entries.filter((e) => e.expiresAt > now),
        }));

        const after = get().entries.length;
        const removed = before - after;

        if (removed > 0) {
          set((state) => ({
            stats: {
              ...state.stats,
              totalEntries: after,
              lastUpdated: Date.now(),
            },
          }));
        }

        return removed;
      },

      // Prune oldest entries
      prune: () => {
        const { entries, config } = get();

        if (entries.length <= config.maxEntries) {
          return 0;
        }

        // Sort by last accessed (oldest first)
        const sorted = [...entries].sort((a, b) => a.lastAccessedAt - b.lastAccessedAt);

        // Keep only maxEntries
        const toKeep = sorted.slice(-config.maxEntries);
        const removed = entries.length - toKeep.length;

        set({
          entries: toKeep,
          stats: {
            ...get().stats,
            totalEntries: toKeep.length,
            lastUpdated: Date.now(),
          },
        });

        return removed;
      },

      // Record cache hit
      recordHit: (key: string) => {
        const now = Date.now();

        set((state) => ({
          entries: state.entries.map((e) => {
            if (e.key === key) {
              return {
                ...e,
                hitCount: e.hitCount + 1,
                lastAccessedAt: now,
              };
            }
            return e;
          }),
          stats: {
            ...state.stats,
            totalHits: state.stats.totalHits + 1,
            lastUpdated: now,
          },
        }));
      },

      // Record cache miss
      recordMiss: () => {
        set((state) => ({
          stats: {
            ...state.stats,
            totalMisses: state.stats.totalMisses + 1,
            lastUpdated: Date.now(),
          },
        }));
      },

      // Update stats
      updateStats: (partial: Partial<CacheStats>) => {
        set((state) => ({
          stats: {
            ...state.stats,
            ...partial,
            lastUpdated: Date.now(),
          },
        }));
      },

      // Reset stats
      resetStats: () => {
        set({
          stats: {
            ...defaultStats,
            lastUpdated: Date.now(),
          },
        });
      },

      // Update configuration
      updateConfig: (partial: Partial<CacheConfig>) => {
        set((state) => ({
          config: {
            ...state.config,
            ...partial,
          },
        }));
      },

      // Get TTL for cache type
      getTTL: (type: CacheType) => {
        return get().config.ttl[type];
      },

      // Check if entry is expired
      isExpired: (entry: CacheEntry) => {
        return entry.expiresAt < Date.now();
      },

      // Get valid (non-expired) entries
      getValidEntries: () => {
        const now = Date.now();
        return get().entries.filter((e) => e.expiresAt > now);
      },

      // Get cache information
      getCacheInfo: () => {
        const { entries, stats } = get();
        const now = Date.now();

        const validEntries = entries.filter((e) => e.expiresAt > now);
        const expiredEntries = entries.filter((e) => e.expiresAt <= now);

        const totalRequests = stats.totalHits + stats.totalMisses;
        const hitRate = totalRequests > 0 ? stats.totalHits / totalRequests : 0;

        return {
          totalSize: entries.length,
          validEntries: validEntries.length,
          expiredEntries: expiredEntries.length,
          hitRate,
        };
      },
    }),
    {
      name: "cacheStore",
      version: 1,
      storage: {
        getItem: async (key: string) => {
          return await researchCacheStorage.getItem<
            StorageValue<CacheStore & CacheFunction>
          >(key);
        },
        setItem: async (
          key: string,
          store: StorageValue<CacheStore & CacheFunction>
        ) => {
          return await researchCacheStorage.setItem(key, {
            state: pick(store.state, ["entries", "stats", "config"]),
            version: store.version,
          });
        },
        removeItem: async (key: string) => await researchCacheStorage.removeItem(key),
      },
      // Run cleanup on load if enabled
      onRehydrateStorage: () => (state) => {
        if (state && state.config.autoCleanup) {
          const removed = state.cleanup();
          if (removed > 0) {
            console.log(`[Cache] Cleaned up ${removed} expired entries`);
          }
        }
      },
    }
  )
);
