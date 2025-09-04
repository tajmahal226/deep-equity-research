/**
 * Cache Busting Utilities
 * 
 * Ensures users always get the latest configuration and models
 */

const CACHE_VERSION_KEY = 'app_cache_version';
const SETTINGS_VERSION_KEY = 'settings_version';
const CURRENT_VERSION = '2.0.0'; // Increment this when making breaking changes

/**
 * Check if cache needs to be cleared
 */
export function checkCacheVersion(): boolean {
  if (typeof window === 'undefined') return false;
  
  const storedVersion = localStorage.getItem(CACHE_VERSION_KEY);
  
  if (!storedVersion || storedVersion !== CURRENT_VERSION) {
    console.log(`[CacheBuster] Version mismatch: stored=${storedVersion}, current=${CURRENT_VERSION}`);
    return true;
  }
  
  return false;
}

/**
 * Clear all cached data and update version
 */
export function clearCache(): void {
  if (typeof window === 'undefined') return;
  
  console.log('[CacheBuster] Clearing all cached data...');
  
  // Save important data that should persist
  const apiKeys: Record<string, string> = {};
  const keysToPreserve = [
    'openAIApiKey',
    'anthropicApiKey',
    'deepseekApiKey',
    'xAIApiKey',
    'mistralApiKey',
    'googleApiKey',
    'tavilyApiKey',
  ];
  
  // Preserve API keys
  keysToPreserve.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      apiKeys[key] = value;
    }
  });
  
  // Clear everything
  localStorage.clear();
  sessionStorage.clear();
  
  // Clear service worker cache if available
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
  }
  
  // Restore API keys
  Object.entries(apiKeys).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });
  
  // Set new version
  localStorage.setItem(CACHE_VERSION_KEY, CURRENT_VERSION);
  localStorage.setItem(SETTINGS_VERSION_KEY, new Date().toISOString());
  
  console.log('[CacheBuster] Cache cleared successfully');
}

/**
 * Initialize cache buster on app start
 */
export function initCacheBuster(): void {
  if (checkCacheVersion()) {
    clearCache();
    
    // Show notification to user
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      if (!params.has('cache_cleared')) {
        params.set('cache_cleared', 'true');
        window.location.search = params.toString();
      }
    }
  }
}

/**
 * Force refresh of specific settings
 */
export function refreshSettings(keys?: string[]): void {
  if (typeof window === 'undefined') return;
  
  const settingsToRefresh = keys || [
    'luna-setting',
    'luna-global',
    'thinkingModel',
    'networkingModel',
    'provider',
  ];
  
  settingsToRefresh.forEach(key => {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      try {
        // Parse and re-save to trigger storage events
        const parsed = JSON.parse(storedValue);
        localStorage.setItem(key, JSON.stringify({
          ...parsed,
          _refreshed: Date.now(),
        }));
      } catch (e) {
        // Not JSON, just remove
        localStorage.removeItem(key);
      }
    }
  });
  
  // Update settings version
  localStorage.setItem(SETTINGS_VERSION_KEY, new Date().toISOString());
}

/**
 * Add cache buster to API requests
 */
export function addCacheBuster(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_cb=${Date.now()}`;
}

/**
 * Create versioned storage key
 */
export function versionedKey(key: string): string {
  return `${key}_v${CURRENT_VERSION}`;
}

/**
 * Migrate old settings to new format
 */
export function migrateSettings(): void {
  if (typeof window === 'undefined') return;
  
  const migrations: Record<string, string> = {
    // Old model names -> New model names
    'gpt-4-turbo': 'gpt-5',
    'claude-3-opus': 'claude-opus-4-1-20250805',
    'claude-3-sonnet': 'claude-sonnet-4-0-20250805',
    'gemini-pro': 'gemini-2.5-pro',
    'gemini-flash': 'gemini-2.5-flash',
    'grok-beta': 'grok-3',
    'grok-2': 'grok-3',
  };
  
  // Get all localStorage keys
  const keys = Object.keys(localStorage);
  
  keys.forEach(key => {
    if (key.includes('Model')) {
      const value = localStorage.getItem(key);
      if (value && migrations[value]) {
        console.log(`[Migration] Updating ${key}: ${value} -> ${migrations[value]}`);
        localStorage.setItem(key, migrations[value]);
      }
    }
  });
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  version: string;
  lastCleared: string | null;
  itemCount: number;
  totalSize: number;
} {
  if (typeof window === 'undefined') {
    return {
      version: CURRENT_VERSION,
      lastCleared: null,
      itemCount: 0,
      totalSize: 0,
    };
  }
  
  let totalSize = 0;
  const itemCount = localStorage.length;
  
  // Estimate storage size
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += key.length + value.length;
      }
    }
  }
  
  return {
    version: localStorage.getItem(CACHE_VERSION_KEY) || 'unknown',
    lastCleared: localStorage.getItem(SETTINGS_VERSION_KEY),
    itemCount,
    totalSize,
  };
}

// Auto-initialize on import
if (typeof window !== 'undefined') {
  // Run on next tick to avoid blocking
  setTimeout(() => {
    initCacheBuster();
    migrateSettings();
  }, 0);
}