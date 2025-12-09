/**
 * Health Check API
 * 
 * Tests connectivity and configuration for all AI providers and services
 */

import { NextRequest, NextResponse } from "next/server";
import { isValidApiKey, isValidModel } from "@/utils/validation";
import { logger } from "@/utils/logger";

export const runtime = "edge";

interface ProviderHealth {
  name: string;
  status: "healthy" | "degraded" | "unhealthy" | "unknown";
  latency?: number;
  error?: string;
  hasApiKey: boolean;
  validModels?: string[];
}

interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  providers: ProviderHealth[];
  services: {
    search: boolean;
    financial: boolean;
    database: boolean;
  };
  system: {
    memory: number;
    uptime: number;
    version: string;
  };
}

// Test provider connectivity
async function checkProvider(
  provider: string,
  apiKey?: string,
  model?: string
): Promise<ProviderHealth> {
  const startTime = Date.now();
  const health: ProviderHealth = {
    name: provider,
    status: "unknown",
    hasApiKey: !!apiKey,
  };

  try {
    // Validate API key format
    if (apiKey) {
      const keyValidation = isValidApiKey(provider, apiKey);
      if (!keyValidation.valid) {
        health.status = "unhealthy";
        health.error = keyValidation.error;
        return health;
      }
    } else {
      health.status = "unknown";
      health.error = "No API key configured";
      return health;
    }

    // Validate model name if provided
    if (model) {
      if (!isValidModel(provider, model)) {
        health.status = "degraded";
        health.error = `Invalid model: ${model}`;
      }
    }

    // Provider-specific health checks
    switch (provider) {
      case "openai":
        await checkOpenAI(apiKey);
        break;
      case "anthropic":
        await checkAnthropic(apiKey);
        break;
      case "google":
        await checkGoogle(apiKey);
        break;
      case "deepseek":
        await checkDeepSeek(apiKey);
        break;
      case "xai":
        await checkXAI(apiKey);
        break;
      case "mistral":
        await checkMistral(apiKey);
        break;
      default:
        // For other providers, just check if API key exists
        if (apiKey) {
          health.status = "healthy";
        }
    }

    health.latency = Date.now() - startTime;
    if (!health.error) {
      health.status = "healthy";
    }

  } catch (error: any) {
    health.status = "unhealthy";
    health.error = error.message || "Connection failed";
    health.latency = Date.now() - startTime;
  }

  return health;
}

async function checkOpenAI(apiKey: string): Promise<void> {
  const response = await fetch("https://api.openai.com/v1/models", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Invalid OpenAI API key");
    }
    throw new Error(`OpenAI API error: ${response.status}`);
  }
}

async function checkAnthropic(apiKey: string): Promise<void> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      messages: [{ role: "user", content: "Hi" }],
      max_tokens: 1,
    }),
    signal: AbortSignal.timeout(5000),
  });

  // Anthropic returns 400 for missing required fields, which means auth worked
  if (response.status === 401) {
    throw new Error("Invalid Anthropic API key");
  }
}

async function checkGoogle(apiKey: string): Promise<void> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    }
  );

  if (!response.ok) {
    if (response.status === 403 || response.status === 401) {
      throw new Error("Invalid Google API key");
    }
    throw new Error(`Google API error: ${response.status}`);
  }
}

async function checkDeepSeek(apiKey: string): Promise<void> {
  const response = await fetch("https://api.deepseek.com/v1/models", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Invalid DeepSeek API key");
    }
    throw new Error(`DeepSeek API error: ${response.status}`);
  }
}

async function checkXAI(apiKey: string): Promise<void> {
  const response = await fetch("https://api.x.ai/v1/models", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Invalid xAI API key");
    }
    throw new Error(`xAI API error: ${response.status}`);
  }
}

async function checkMistral(apiKey: string): Promise<void> {
  const response = await fetch("https://api.mistral.ai/v1/models", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Invalid Mistral API key");
    }
    throw new Error(`Mistral API error: ${response.status}`);
  }
}

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Check all configured providers
    const providers = [
      { id: "openai", key: process.env.OPENAI_API_KEY },
      { id: "anthropic", key: process.env.ANTHROPIC_API_KEY },
      { id: "google", key: process.env.GOOGLE_GENERATIVE_AI_API_KEY },
      { id: "deepseek", key: process.env.DEEPSEEK_API_KEY },
      { id: "xai", key: process.env.XAI_API_KEY },
      { id: "mistral", key: process.env.MISTRAL_API_KEY },
      { id: "groq", key: process.env.GROQ_API_KEY },
      { id: "cohere", key: process.env.COHERE_API_KEY },
      { id: "together", key: process.env.TOGETHER_API_KEY },
      { id: "perplexity", key: process.env.PERPLEXITY_API_KEY },
    ];

    // Check providers in parallel
    const providerChecks = await Promise.all(
      providers.map(({ id, key }) => checkProvider(id, key))
    );

    // Determine overall health using only configured providers
    const configuredProviders = providerChecks.filter(p => p.hasApiKey);
    const healthyCount = configuredProviders.filter(
      provider => provider.status === "healthy"
    ).length;

    const configuredTotal = configuredProviders.length || 1; // avoid divide-by-zero

    let overallStatus: "healthy" | "degraded" | "unhealthy";
    if (healthyCount >= configuredTotal * 0.7) {
      overallStatus = "healthy";
    } else if (healthyCount >= configuredTotal * 0.3) {
      overallStatus = "degraded";
    } else {
      overallStatus = "unhealthy";
    }

    // Check service availability
    const services = {
      search: !!process.env.TAVILY_API_KEY || !!process.env.EXA_API_KEY,
      financial: !!process.env.FINANCIAL_DATASETS_API_KEY || 
                 !!process.env.ALPHA_VANTAGE_API_KEY,
      database: true, // Always true for now
    };

    // System information
    const system = {
      memory:
        typeof process !== "undefined" &&
        typeof process.memoryUsage === "function"
          ? process.memoryUsage().heapUsed
          : 0,
      uptime: Date.now() - startTime,
      version: process.env.NEXT_PUBLIC_VERSION || "0.0.1",
    };

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      providers: providerChecks,
      services,
      system,
    };

    // Log health check
    logger.log(`[HealthCheck] Status: ${overallStatus}, Providers: ${healthyCount}/${providers.length} healthy`);

    return NextResponse.json(response, {
      status: overallStatus === "unhealthy" ? 503 : 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });

  } catch (error) {
    console.error("[HealthCheck] Error:", error);
    
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        providers: [],
        services: {
          search: false,
          financial: false,
          database: false,
        },
        system: {
          memory: 0,
          uptime: 0,
          version: "0.0.1",
        },
      },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Allow testing specific providers
  try {
    const body = await req.json();
    const { provider, apiKey, model } = body;
    
    if (!provider) {
      return NextResponse.json(
        { error: "Provider is required" },
        { status: 400 }
      );
    }
    
    const health = await checkProvider(provider, apiKey, model);
    
    return NextResponse.json(health, {
      status: health.status === "healthy" ? 200 : 503,
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}