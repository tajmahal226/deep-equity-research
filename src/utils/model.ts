import { shuffle } from "radash";

/**
 * RACE CONDITION FIX:
 * - Added caching to avoid constant reshuffling on every request
 * - Added validation to filter out empty/invalid keys before shuffling
 * - Returns empty string if no valid keys found (consistent with original behavior)
 */

// Cache for API key rotation to prevent race conditions
interface KeyRotationCache {
  keys: string[];
  lastRotation: number;
  currentIndex: number;
}

const keyCache = new Map<string, KeyRotationCache>();

// Cache TTL: rotate keys every 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Polls API keys with rotation support
 *
 * RACE CONDITION FIXES:
 * 1. Validates keys before shuffling (filters empty strings)
 * 2. Caches the shuffled order to avoid constant re-rotation on every request
 * 3. Uses round-robin within the cached shuffled order for predictable distribution
 *
 * @param apiKeys - Comma-separated list of API keys
 * @param providerName - Optional provider name for cache key (defaults to "default")
 * @returns A single API key or empty string if none valid
 */
export function multiApiKeyPolling(apiKeys = "", providerName = "default"): string {
  // Fast path: empty input
  if (!apiKeys || apiKeys.trim() === "") {
    return "";
  }

  const cacheKey = `${providerName}`;
  const now = Date.now();

  // Split and filter valid keys (remove empty strings and whitespace-only entries)
  const validKeys = apiKeys
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0);

  // No valid keys found
  if (validKeys.length === 0) {
    return "";
  }

  // Single key - no rotation needed
  if (validKeys.length === 1) {
    return validKeys[0];
  }

  // Check cache
  const cached = keyCache.get(cacheKey);

  // Rotate if cache is stale or doesn't exist
  if (!cached || now - cached.lastRotation > CACHE_TTL) {
    const shuffled = shuffle(validKeys);
    keyCache.set(cacheKey, {
      keys: shuffled,
      lastRotation: now,
      currentIndex: 0,
    });
    return shuffled[0];
  }

  // Use round-robin within cached shuffled keys
  const index = cached.currentIndex;
  const key = cached.keys[index];

  // Move to next key for next request
  cached.currentIndex = (index + 1) % cached.keys.length;

  return key;
}

/**
 * Clear the key rotation cache (useful for testing or force rotation)
 */
export function clearKeyCache(providerName?: string): void {
  if (providerName) {
    keyCache.delete(providerName);
  } else {
    keyCache.clear();
  }
}

/**
 * Get cache statistics (useful for monitoring)
 */
export function getKeyCacheStats() {
  return {
    totalCachedProviders: keyCache.size,
    providers: Array.from(keyCache.entries()).map(([key, value]) => ({
      provider: key,
      keyCount: value.keys.length,
      currentIndex: value.currentIndex,
      lastRotation: new Date(value.lastRotation).toISOString(),
    })),
  };
}

export function isThinkingModel(model: string) {
  return (
    model.includes("thinking") ||
    model.startsWith("gemini-2.5-pro") ||
    model.startsWith("gemini-2.5-flash") ||
    model.startsWith("gemini-3-pro") ||
    model.startsWith("gemini-3-flash")
  );
}

export function isNetworkingModel(model: string) {
  return (
    (model.startsWith("gemini-2.0-flash") &&
      !model.includes("lite") &&
      !model.includes("thinking") &&
      !model.includes("image")) ||
    model.startsWith("gemini-2.5-pro") ||
    model.startsWith("gemini-2.5-flash") ||
    model.startsWith("gemini-3-pro") ||
    model.startsWith("gemini-3-flash")
  );
}

export function getCustomModelList(customModelList: string[]) {
  const availableModelList: string[] = [];
  const disabledModelList: string[] = [];
  customModelList.forEach((model) => {
    if (model.startsWith("+")) {
      availableModelList.push(model.substring(1));
    } else if (model.startsWith("-")) {
      disabledModelList.push(model.substring(1));
    } else {
      availableModelList.push(model);
    }
  });
  return { availableModelList, disabledModelList };
}
