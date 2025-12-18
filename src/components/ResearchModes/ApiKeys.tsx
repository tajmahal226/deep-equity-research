/**
 * API Keys Component
 * 
 * This component provides a simple interface with links to obtain API keys
 * from all supported AI and search providers.
 */

"use client";
import { Card } from "@/components/ui/card";
import { Key, ExternalLink, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface ProviderInfo {
  name: string;
  url: string;
  compatibility: "full" | "partial" | "limited";
  compatibilityText: string;
  recommendedModels?: string;
}

const providers: ProviderInfo[] = [
  {
    name: "OpenAI",
    url: "https://platform.openai.com/api-keys",
    compatibility: "full",
    compatibilityText: "100% - All modules working",
    recommendedModels: "gpt-5 + gpt-5-turbo"
  },
  {
    name: "Anthropic",
    url: "https://console.anthropic.com/settings/keys",
    compatibility: "partial",
    compatibilityText: "88% - 7/8 modules working",
    recommendedModels: "claude-opus-4.1 + claude-sonnet-4.0"
  },
  {
    name: "DeepSeek",
    url: "https://platform.deepseek.com/api_keys",
    compatibility: "full",
    compatibilityText: "100% - All modules working",
    recommendedModels: "deepseek-reasoner + deepseek-chat"
  },
  {
    name: "xAI (Grok)",
    url: "https://console.x.ai/",
    compatibility: "full",
    compatibilityText: "100% - All modules working",
    recommendedModels: "grok-3 (both)"
  },
  {
    name: "Mistral",
    url: "https://console.mistral.ai/api-keys",
    compatibility: "full",
    compatibilityText: "100% - All modules working",
    recommendedModels: "mistral-large-2411 + mistral-large"
  },
  {
    name: "Google Gemini",
    url: "https://aistudio.google.com/app/apikey",
    compatibility: "partial",
    compatibilityText: "75% - 6/8 modules working",
    recommendedModels: "gemini-2.5-flash-thinking + gemini-2.5-pro"
  },
  {
    name: "Groq",
    url: "https://console.groq.com/keys",
    compatibility: "limited",
    compatibilityText: "50% - 4/8 modules working",
    recommendedModels: "llama-3.3-70b-versatile (both)"
  },
  {
    name: "Cohere",
    url: "https://dashboard.cohere.com/api-keys",
    compatibility: "limited",
    compatibilityText: "50% - 4/8 modules working",
    recommendedModels: "command-r-plus-08-2024 (both)"
  },
  {
    name: "Together AI",
    url: "https://api.together.xyz/settings/api-keys",
    compatibility: "limited",
    compatibilityText: "50% - 4/8 modules working",
    recommendedModels: "QwQ-32B-Preview + Llama-3.3-70B"
  },
  {
    name: "Perplexity",
    url: "https://www.perplexity.ai/settings/api",
    compatibility: "limited",
    compatibilityText: "50% - 4/8 modules working",
    recommendedModels: "sonar-huge-128k + sonar-large-128k"
  },
  {
    name: "OpenRouter",
    url: "https://openrouter.ai/keys",
    compatibility: "full",
    compatibilityText: "Access to multiple providers",
    recommendedModels: "Any available model"
  },
  {
    name: "Fireworks AI",
    url: "https://app.fireworks.ai/users/api-keys",
    compatibility: "full",
    compatibilityText: "OpenAI-compatible endpoints",
    recommendedModels: "firefunction-v2 or llama models"
  },
  {
    name: "Moonshot (Kimi)",
    url: "https://kimi.moonshot.cn/account/keys",
    compatibility: "partial",
    compatibilityText: "Chat completions compatible",
    recommendedModels: "moonshot-v1-32k + moonshot-v1-8k"
  }
];

const searchProviders = [
  {
    name: "Tavily Search",
    url: "https://app.tavily.com/home",
    description: "Recommended - AI-optimized search"
  },
  {
    name: "Serper API",
    url: "https://serper.dev/api-key",
    description: "Google search results API"
  },
  {
    name: "SerpAPI",
    url: "https://serpapi.com/manage-api-key",
    description: "Multiple search engines"
  },
  {
    name: "Bing Search",
    url: "https://www.microsoft.com/en-us/bing/apis/bing-web-search-api",
    description: "Microsoft Bing search"
  }
];

const financialProviders = [
  {
    name: "Alpha Vantage",
    url: "https://www.alphavantage.co/support/#api-key",
    description: "Free tier available"
  },
  {
    name: "Polygon.io",
    url: "https://polygon.io/dashboard/api-keys",
    description: "Real-time market data"
  },
  {
    name: "IEX Cloud",
    url: "https://iexcloud.io/console/tokens",
    description: "Financial data API"
  }
];

export default function ApiKeys() {
  const getCompatibilityIcon = (compatibility: string) => {
    switch (compatibility) {
      case "full":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "partial":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "limited":
        return <XCircle className="w-5 h-5 text-orange-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Key className="w-8 h-8 text-primary" />
          <h2 className="text-3xl font-bold">API Key Resources</h2>
        </div>
        <p className="text-muted-foreground">
          Click on any provider name to get your API key
        </p>
      </div>

      {/* AI Providers */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold mb-4">AI Model Providers</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {providers.map((provider) => (
            <Card key={provider.name} className="p-4 hover:shadow-lg transition-shadow">
              <a
                href={provider.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">{provider.name}</span>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </div>
                  {getCompatibilityIcon(provider.compatibility)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {provider.compatibilityText}
                </div>
                {provider.recommendedModels && (
                  <div className="text-xs text-primary">
                    Recommended: {provider.recommendedModels}
                  </div>
                )}
              </a>
            </Card>
          ))}
        </div>
      </div>

      {/* Search Providers */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold mb-4">Search Providers</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {searchProviders.map((provider) => (
            <Card key={provider.name} className="p-4 hover:shadow-lg transition-shadow">
              <a
                href={provider.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{provider.name}</span>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-sm text-muted-foreground">
                  {provider.description}
                </div>
              </a>
            </Card>
          ))}
        </div>
      </div>

      {/* Financial Data Providers */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold mb-4">Financial Data Providers (Optional)</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {financialProviders.map((provider) => (
            <Card key={provider.name} className="p-4 hover:shadow-lg transition-shadow">
              <a
                href={provider.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{provider.name}</span>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-sm text-muted-foreground">
                  {provider.description}
                </div>
              </a>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Tips */}
      <Card className="p-6 bg-muted/30">
        <h3 className="font-semibold mb-3">Quick Tips</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• <strong>Best Reasoning:</strong> OpenAI GPT-5/O3 models and DeepSeek Reasoner lead in complex analysis</li>
          <li>• <strong>Best Value:</strong> DeepSeek Reasoner offers GPT-4 level performance at 95% lower cost</li>
          <li>• <strong>Best Compatibility:</strong> OpenAI, DeepSeek, xAI, and Mistral work with all 8 modules</li>
          <li>• <strong>Search Required:</strong> At least one search provider (Tavily recommended) is needed for research</li>
          <li>• <strong>Financial Optional:</strong> Financial data providers are only needed for real-time market data</li>
        </ul>
      </Card>

      {/* Documentation Link */}
      <div className="text-center pt-4">
        <a 
          href="https://github.com/tajmahal226/deep-equity-research/blob/main/RECOMMENDED_MODEL_COMBINATIONS.md"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-primary hover:underline"
        >
          View Detailed Model Recommendations
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
