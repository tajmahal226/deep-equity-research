/**
 * Cache Settings Component
 *
 * Displays cache analytics and configuration options
 */

"use client";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Database,
  TrendingUp,
  DollarSign,
  Zap,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useResearchCache } from "@/hooks/useResearchCache";
import { useSettingStore } from "@/store/setting";

export default function CacheSettings() {
  const settingStore = useSettingStore();
  const {
    isCacheEnabled,
    cacheStats,
    clearCache,
    cleanupCache,
  } = useResearchCache();

  const [cleanupCount, setCleanupCount] = useState<number | null>(null);

  const handleCleanup = () => {
    const removed = cleanupCache();
    setCleanupCount(removed);
    setTimeout(() => setCleanupCount(null), 3000);
  };

  const handleToggleCache = (enabled: boolean) => {
    settingStore.update({ cacheEnabled: enabled ? "enable" : "disable" });
  };

  return (
    <div className="space-y-6">
      {/* Cache Status & Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Research Cache
          </CardTitle>
          <CardDescription>
            Intelligent caching to reduce API costs and speed up repeated research
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Cache</Label>
              <p className="text-sm text-muted-foreground">
                Cache research results to avoid duplicate API calls
              </p>
            </div>
            <Switch
              checked={isCacheEnabled}
              onCheckedChange={handleToggleCache}
            />
          </div>

          {/* Analytics */}
          {isCacheEnabled && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Cache Hits
                  </div>
                  <div className="text-2xl font-bold">{cacheStats.totalHits}</div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <XCircle className="h-4 w-4 text-orange-600" />
                    Cache Misses
                  </div>
                  <div className="text-2xl font-bold">{cacheStats.totalMisses}</div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    Hit Rate
                  </div>
                  <div className="text-2xl font-bold">
                    {(cacheStats.hitRate * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    Savings
                  </div>
                  <div className="text-2xl font-bold">{cacheStats.estimatedSavings}</div>
                  <div className="text-xs text-muted-foreground">
                    {cacheStats.estimatedTokenSavings} tokens
                  </div>
                </div>
              </div>

              {/* Cache Management Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCleanup}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Cleanup Expired
                  {cleanupCount !== null && (
                    <Badge variant="secondary" className="ml-2">
                      {cleanupCount} removed
                    </Badge>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    if (window.confirm("Clear all cached research? This cannot be undone.")) {
                      clearCache();
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Cache
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Cache Configuration */}
      {isCacheEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cache Configuration</CardTitle>
            <CardDescription>
              Configure how long research results are cached (in hours)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-ttl">Company Research TTL</Label>
                <Input
                  id="company-ttl"
                  type="number"
                  min="1"
                  max="168"
                  value={settingStore.cacheTTLCompanyResearch}
                  onChange={(e) =>
                    settingStore.update({
                      cacheTTLCompanyResearch: parseInt(e.target.value) || 24,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">Hours (default: 24)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="market-ttl">Market Research TTL</Label>
                <Input
                  id="market-ttl"
                  type="number"
                  min="1"
                  max="168"
                  value={settingStore.cacheTTLMarketResearch}
                  onChange={(e) =>
                    settingStore.update({
                      cacheTTLMarketResearch: parseInt(e.target.value) || 12,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">Hours (default: 12)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulk-ttl">Bulk Research TTL</Label>
                <Input
                  id="bulk-ttl"
                  type="number"
                  min="1"
                  max="168"
                  value={settingStore.cacheTTLBulkResearch}
                  onChange={(e) =>
                    settingStore.update({
                      cacheTTLBulkResearch: parseInt(e.target.value) || 24,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">Hours (default: 24)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="freeform-ttl">Free-Form Research TTL</Label>
                <Input
                  id="freeform-ttl"
                  type="number"
                  min="1"
                  max="168"
                  value={settingStore.cacheTTLFreeForm}
                  onChange={(e) =>
                    settingStore.update({
                      cacheTTLFreeForm: parseInt(e.target.value) || 6,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">Hours (default: 6)</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-entries">Maximum Cache Entries</Label>
              <Input
                id="max-entries"
                type="number"
                min="10"
                max="10000"
                value={settingStore.cacheMaxEntries}
                onChange={(e) =>
                  settingStore.update({
                    cacheMaxEntries: parseInt(e.target.value) || 500,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Number of research results to keep (default: 500)
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Cleanup</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically remove expired entries on load
                </p>
              </div>
              <Switch
                checked={settingStore.cacheAutoCleanup === "enable"}
                onCheckedChange={(checked) =>
                  settingStore.update({
                    cacheAutoCleanup: checked ? "enable" : "disable",
                  })
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                How cache works
              </p>
              <p className="text-blue-800 dark:text-blue-200">
                Research results are cached based on company name, search depth, AI provider, and
                other parameters. When you search for the same company with the same settings,
                cached results are returned instantly, saving time and API costs.
              </p>
              <p className="text-blue-800 dark:text-blue-200 mt-2">
                Use the <strong>Refresh</strong> button to bypass cache and fetch fresh data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
