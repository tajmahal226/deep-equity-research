/**
 * Company Deep Dive Research API Route
 * 
 * This file handles the Server-Sent Events (SSE) API endpoint for company-specific research.
 * It's similar to the general deep research API (/api/sse/route.ts) but tailored for company analysis.
 * 
 * What this does:
 * - Receives a POST request with company details (name, website, industry, competitors, etc.)
 * - Creates a real-time stream of research progress back to the client
 * - Orchestrates the entire research process from planning to final report
 * 
 * Files it depends on:
 * - /src/utils/company-deep-research/index.ts (main research logic - we'll create this next)
 * - /src/constants/companyDivePrompts.ts (investment research prompts and structure)
 * - /src/hooks/useSearchProvider.ts (search provider configurations)
 * - /src/hooks/useAiProvider.ts (AI provider configurations)
 * 
 * How to modify:
 * - To add new research depth levels: Update the searchDepth handling in the request body
 * - To change the research flow: Modify the CompanyDeepResearch class methods
 * - To add new event types: Add them to the SSE event sending logic
 */

import { NextRequest } from "next/server";
import { CompanyDeepResearch } from "@/utils/company-deep-research";
import { createSSEStream, getSSEHeaders } from "@/utils/sse";
import { nanoid } from "nanoid";
import { logger } from "@/utils/logger";
import {
  OPERATION_TIMEOUTS,
  withTimeout,
  retryWithBackoff
} from "@/utils/timeout-config";

// Configure Node.js runtime for long-running research operations
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes (Vercel Hobby max)

// Helper function to get default model configuration for any provider
function getDefaultModelConfig(providerId?: string) {
  switch (providerId) {
    case "anthropic":
      return { thinkingModel: "claude-opus-4-1-20250805", networkingModel: "claude-sonnet-4-0-20250805" };
    case "deepseek":
      return { thinkingModel: "deepseek-reasoner", networkingModel: "deepseek-chat" };
    case "mistral":
      return { thinkingModel: "mistral-large-2411", networkingModel: "mistral-large-latest" };
    case "xai":
      return { thinkingModel: "grok-3", networkingModel: "grok-3" };
    case "google":
      return { thinkingModel: "gemini-2.5-flash-thinking", networkingModel: "gemini-2.5-pro" };
    case "openrouter":
      return { thinkingModel: "anthropic/claude-3.5-sonnet", networkingModel: "anthropic/claude-3.5-sonnet" };
    case "ollama":
      return { thinkingModel: "llama3.1:8b", networkingModel: "llama3.1:8b" };
    case "openai":
    default:
      return { thinkingModel: "gpt-5", networkingModel: "gpt-5-turbo" };
  }
}

// Define the shape of our request body for TypeScript type safety
interface CompanyResearchRequest {
  // Core company information
  companyName: string;
  companyWebsite?: string;
  industry?: string;
  
  // Arrays of related data
  subIndustries?: string[];
  competitors?: string[];
  researchSources?: string[];
  
  // Additional context from user
  additionalContext?: string;
  
  // Research depth: "fast" (1-2 min), "medium" (~5 min), or "deep" (10-15 min)
  searchDepth: "fast" | "medium" | "deep";
  
  // Optional language override
  language?: string;
  
  // AI provider settings (inherits from general settings if not specified)
  thinkingModelId?: string;
  taskModelId?: string;
  thinkingProviderId?: string;
  taskProviderId?: string;
  
  // API keys for client-side configuration
  thinkingApiKey?: string;
  taskApiKey?: string;
  
  // Reasoning effort configuration
  thinkingReasoningEffort?: "low" | "medium" | "high";
  taskReasoningEffort?: "low" | "medium" | "high";
  
  // Search provider settings
  searchProviderId?: string;
  searchApiKey?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Step 1: Check for ACCESS_PASSWORD if configured
    // This is a simple way to protect your API endpoint
    const accessPassword = process.env.ACCESS_PASSWORD;
    if (accessPassword) {
      // Get the password from the Authorization header or query parameter
      const authHeader = req.headers.get("Authorization");
      const providedPassword = authHeader?.replace("Bearer ", "") || 
                              new URL(req.url).searchParams.get("access_password");
      
      if (providedPassword !== accessPassword) {
        return new Response("Unauthorized", { status: 403 });
      }
    }

    // Step 2: Parse the request body to get company research parameters
    const body: CompanyResearchRequest = await req.json();
    
    // Validate required fields
    if (!body.companyName || !body.searchDepth) {
      return new Response("Missing required fields: companyName and searchDepth", { 
        status: 400 
      });
    }

    // Step 3: Generate a unique ID for this research session
    // This helps track the research in logs and for debugging
    const researchId = nanoid();
    logger.log(`[Company Research ${researchId}] Starting research for: ${body.companyName}`);

    // Step 4: Create the SSE (Server-Sent Events) stream
    // SSE allows us to send real-time updates to the client as research progresses
    const { stream, sendEvent, closeStream } = createSSEStream();

    // Step 5: Initialize the company research engine
    // This class handles all the research logic
    const researcher = new CompanyDeepResearch({
      // Company-specific data
      companyName: body.companyName,
      companyWebsite: body.companyWebsite,
      industry: body.industry,
      subIndustries: body.subIndustries || [],
      competitors: body.competitors || [],
      researchSources: body.researchSources || [],
      additionalContext: body.additionalContext,
      
      // Research configuration
      searchDepth: body.searchDepth,
      language: body.language || "en-US",
      
      // AI provider configuration with smart defaults for all providers
      thinkingModelConfig: (() => {
        logger.log(`[DEBUG] Company Research API: thinkingModelId=${body.thinkingModelId}, thinkingProviderId=${body.thinkingProviderId}`);
        
        if (body.thinkingModelId && body.thinkingProviderId) {
          const config = {
            modelId: body.thinkingModelId,
            providerId: body.thinkingProviderId,
            apiKey: body.thinkingApiKey,
            reasoningEffort: body.thinkingReasoningEffort,
          };
          logger.log(`[DEBUG] Company Research API: Using explicit thinking config:`, config);
          return config;
        } else {
          const defaults = getDefaultModelConfig(body.thinkingProviderId);
          const config = {
            modelId: defaults.thinkingModel,
            providerId: body.thinkingProviderId || "openai",
            apiKey: undefined, // Will use server-side API key
            reasoningEffort: body.thinkingReasoningEffort,
          };
          logger.log(`[DEBUG] Company Research API: Using default thinking config:`, config);
          return config;
        }
      })(),
      
      taskModelConfig: (() => {
        logger.log(`[DEBUG] Company Research API: taskModelId=${body.taskModelId}, taskProviderId=${body.taskProviderId}`);
        
        if (body.taskModelId && body.taskProviderId) {
          const config = {
            modelId: body.taskModelId,
            providerId: body.taskProviderId,
            apiKey: body.taskApiKey,
            reasoningEffort: body.taskReasoningEffort,
          };
          logger.log(`[DEBUG] Company Research API: Using explicit task config:`, config);
          return config;
        } else {
          const defaults = getDefaultModelConfig(body.taskProviderId);
          const config = {
            modelId: defaults.networkingModel,
            providerId: body.taskProviderId || "openai",
            apiKey: undefined, // Will use server-side API key
            reasoningEffort: body.taskReasoningEffort,
          };
          logger.log(`[DEBUG] Company Research API: Using default task config:`, config);
          return config;
        }
      })(),
      
      // Search provider configuration
      searchProviderId: body.searchProviderId,
      searchProviderApiKey: body.searchApiKey,
      
      // Callback functions to send real-time updates to the client
      onProgress: (data) => {
        // Send progress updates (e.g., "Starting competitive analysis...")
        sendEvent("progress", data);
      },
      onMessage: (data) => {
        // Send message chunks as they're generated
        sendEvent("message", data);
      },
      onReasoning: (data) => {
        // Send AI reasoning process (what the AI is thinking)
        sendEvent("reasoning", data);
      },
      onError: (error) => {
        // Send error messages if something goes wrong
        sendEvent("error", { message: error.message });
      },
    });

    // Step 6: Run the research based on the selected depth with proper timeouts
    try {
      let result;
      
      // Determine timeout based on search depth
      let depthTimeout: number;
      
      switch (body.searchDepth) {
        case "fast":
          // Fast mode: Direct AI response, no web searches
          depthTimeout = OPERATION_TIMEOUTS.COMPANY_FAST;
          logger.log(`[Company Research ${researchId}] Running fast research with ${depthTimeout}ms timeout`);
          
          result = await retryWithBackoff(
            async () => withTimeout(
              researcher.runFastResearch(),
              depthTimeout,
              `Fast research timed out after ${depthTimeout}ms`
            ),
            { maxRetries: 2, initialDelay: 2000 }
          );
          break;
          
        case "medium":
          // Medium mode: Limited searches focusing on key areas
          depthTimeout = OPERATION_TIMEOUTS.COMPANY_MEDIUM;
          logger.log(`[Company Research ${researchId}] Running medium research with ${depthTimeout}ms timeout`);
          
          result = await retryWithBackoff(
            async () => withTimeout(
              researcher.runMediumResearch(),
              depthTimeout,
              `Medium research timed out after ${depthTimeout}ms`
            ),
            { maxRetries: 2, initialDelay: 3000 }
          );
          break;
          
        case "deep":
          // Deep mode: Comprehensive research with all investment sections
          depthTimeout = OPERATION_TIMEOUTS.COMPANY_DEEP;
          logger.log(`[Company Research ${researchId}] Running deep research with ${depthTimeout}ms timeout`);
          
          result = await retryWithBackoff(
            async () => withTimeout(
              researcher.runDeepResearch(),
              depthTimeout,
              `Deep research timed out after ${depthTimeout}ms`
            ),
            { maxRetries: 1, initialDelay: 5000 }  // Only retry once for deep mode
          );
          break;
          
        default:
          throw new Error(`Invalid search depth: ${body.searchDepth}`);
      }

      // Step 7: Send the final result
      // This includes the complete report, sources, and any images found
      sendEvent("complete", {
        report: result.report,
        sources: result.sources,
        images: result.images,
        metadata: {
          companyName: body.companyName,
          searchDepth: body.searchDepth,
          researchId: researchId,
          completedAt: new Date().toISOString(),
        }
      });

      logger.log(`[Company Research ${researchId}] Research completed successfully`);
      
      // Set up keepalive to prevent connection drops
      const keepaliveInterval = setInterval(() => {
        sendEvent("keepalive", { timestamp: new Date().toISOString() });
      }, OPERATION_TIMEOUTS.SSE_KEEPALIVE);
      
      // Give time for final events to send
      await new Promise(resolve => setTimeout(resolve, 1000));
      clearInterval(keepaliveInterval);
      
    } catch (error) {
      // Handle any errors during research
      console.error(`[Company Research ${researchId}] Error:`, error);
      
      // Provide more detailed error messages
      let errorMessage = "Unknown error occurred";
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          errorMessage = `Research timed out. The model (${body.thinkingModelId || 'default'}) may be slower than expected. Try using 'fast' mode or a faster model.`;
        } else {
          errorMessage = error.message;
        }
      }
      
      sendEvent("error", { 
        message: errorMessage,
        researchId: researchId,
        searchDepth: body.searchDepth,
        provider: body.thinkingProviderId
      });
    } finally {
      // Always close the stream when done
      closeStream();
    }

    // Return the SSE stream to the client with proper headers
    return new Response(stream, {
      headers: getSSEHeaders(),
    });

  } catch (error) {
    // Handle any errors in request processing
    console.error("Company research API error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        message: error instanceof Error ? error.message : "Unknown error" 
      }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

// This API only supports POST requests
export async function GET() {
  return new Response("Method not allowed. Please use POST.", { status: 405 });
}