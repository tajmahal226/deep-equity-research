/**
 * Bulk Company Research API Route
 * 
 * This file handles the Server-Sent Events (SSE) API endpoint for researching multiple companies.
 * It's designed to run "fast" company deep dives for a list of companies in parallel or sequence.
 * 
 * What this does:
 * - Receives a POST request with a list of company names
 * - Runs a "fast" deep dive research for each company
 * - Sends real-time updates as each company is processed
 * - Returns individual results for each company as they complete
 * 
 * Files it depends on:
 * - /src/utils/company-deep-research/index.ts (the single company research logic we reuse)
 * - /src/utils/sse.ts (for Server-Sent Events streaming)
 * 
 * How to modify:
 * - To change the research depth: Modify the searchDepth parameter in runBulkResearch
 * - To add more company data: Update the BulkCompanyRequest interface
 * - To change parallelism: Adjust the BATCH_SIZE constant
 */

import { NextRequest } from "next/server";
import { CompanyDeepResearch } from "@/utils/company-deep-research";
import { createSSEStream, getSSEHeaders } from "@/utils/sse";
import { nanoid } from "nanoid";
import { logger } from "@/utils/logger";

// Helper function to get default model configuration for any provider
function getDefaultModelConfig(providerId?: string) {
  switch (providerId) {
    case "anthropic":
      return { thinkingModel: "claude-3-5-sonnet-20241022", networkingModel: "claude-3-5-haiku-20241022" };
    case "deepseek":
      return { thinkingModel: "deepseek-reasoner", networkingModel: "deepseek-chat" };
    case "mistral":
      return { thinkingModel: "mistral-large-latest", networkingModel: "mistral-medium-latest" };
    case "xai":
      return { thinkingModel: "grok-2-1212", networkingModel: "grok-2-mini-1212" };
    case "azure":
      return { thinkingModel: "gpt-4o", networkingModel: "gpt-4o-mini" };
    case "google":
      return { thinkingModel: "gemini-2.0-flash-exp", networkingModel: "gemini-1.5-flash" };
    case "openrouter":
      return { thinkingModel: "anthropic/claude-3.5-sonnet", networkingModel: "anthropic/claude-3.5-haiku" };
    case "openai":
    default:
      return { thinkingModel: "gpt-4o", networkingModel: "gpt-4o-mini" };
  }
}

// Define how many companies to research at the same time
// Lower = less resource usage, Higher = faster completion
const BATCH_SIZE = 3;

// Define the shape of our request for TypeScript type safety
interface BulkCompanyRequest {
  // Array of company names to research
  companies: string[];
  
  // Optional: Industry context that applies to all companies
  // This helps the AI understand the general space these companies operate in
  commonIndustry?: string;
  
  // Optional: Language for the reports
  language?: string;
  
  // Optional: AI provider settings (inherits from general settings if not specified)
  thinkingModelId?: string;
  taskModelId?: string;
  thinkingProviderId?: string;
  taskProviderId?: string;
  
  // API keys for client-side configuration
  thinkingApiKey?: string;
  taskApiKey?: string;
  
  // Search provider settings
  searchProviderId?: string;
  searchApiKey?: string;
}

// This is what we'll send back for each company
interface CompanyResult {
  companyName: string;
  status: "pending" | "processing" | "completed" | "error";
  result?: any; // The actual research result
  error?: string; // Error message if something went wrong
  startedAt?: string;
  completedAt?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Step 1: Check for ACCESS_PASSWORD if configured
    // This protects your API from unauthorized use
    const accessPassword = process.env.ACCESS_PASSWORD;
    if (accessPassword) {
      const authHeader = req.headers.get("Authorization");
      const providedPassword = authHeader?.replace("Bearer ", "") || 
                              new URL(req.url).searchParams.get("access_password");
      
      if (providedPassword !== accessPassword) {
        return new Response("Unauthorized", { status: 403 });
      }
    }

    // Step 2: Parse the request body
    const body: BulkCompanyRequest = await req.json();
    
    // Validate that we have companies to research
    if (!body.companies || !Array.isArray(body.companies) || body.companies.length === 0) {
      return new Response("Missing or empty companies array", { status: 400 });
    }

    // Limit the number of companies to prevent abuse
    const MAX_COMPANIES = 50;
    if (body.companies.length > MAX_COMPANIES) {
      return new Response(`Too many companies. Maximum is ${MAX_COMPANIES}`, { status: 400 });
    }

    // Step 3: Generate a unique ID for this bulk research session
    const bulkResearchId = nanoid();
    logger.log(`[Bulk Research ${bulkResearchId}] Starting research for ${body.companies.length} companies`);

    // Step 4: Create the SSE stream for real-time updates
    const { stream, sendEvent, closeStream } = createSSEStream();

    // Step 5: Initialize tracking for all companies
    // We'll update this object as we process each company
    const companyResults: Record<string, CompanyResult> = {};
    body.companies.forEach(companyName => {
      companyResults[companyName] = {
        companyName,
        status: "pending"
      };
    });

    // Send initial status to client
    sendEvent("status", {
      bulkResearchId,
      totalCompanies: body.companies.length,
      companies: Object.values(companyResults)
    });

    // Step 6: Process companies in batches
    // This function runs the research for a single company
    const processCompany = async (companyName: string) => {
      logger.log(`[Bulk Research ${bulkResearchId}] Starting research for: ${companyName}`);
      
      try {
        // Update status to processing
        companyResults[companyName].status = "processing";
        companyResults[companyName].startedAt = new Date().toISOString();
        
        // Send update that we're starting this company
        sendEvent("company-start", {
          companyName,
          status: "processing"
        });

        // Create a researcher instance for this company
        const researcher = new CompanyDeepResearch({
          companyName,
          // We don't have website or competitors for bulk research
          // But we can use the common industry if provided
          industry: body.commonIndustry,
          subIndustries: [],
          competitors: [],
          researchSources: [],
          
          // Always use "fast" mode for bulk research
          searchDepth: "fast",
          language: body.language || "en-US",
          
          // AI provider configuration with smart defaults for all providers
          thinkingModelConfig: body.thinkingModelId && body.thinkingProviderId ? {
            modelId: body.thinkingModelId,
            providerId: body.thinkingProviderId,
            apiKey: body.thinkingApiKey,
          } : (() => {
            const defaults = getDefaultModelConfig(body.thinkingProviderId);
            return {
              modelId: defaults.thinkingModel,
              providerId: body.thinkingProviderId || "openai",
              apiKey: undefined, // Will use server-side API key
            };
          })(),
          
          taskModelConfig: body.taskModelId && body.taskProviderId ? {
            modelId: body.taskModelId,
            providerId: body.taskProviderId,
            apiKey: body.taskApiKey,
          } : (() => {
            const defaults = getDefaultModelConfig(body.taskProviderId);
            return {
              modelId: defaults.networkingModel,
              providerId: body.taskProviderId || "openai",
              apiKey: undefined, // Will use server-side API key
            };
          })(),
          
          // Search provider configuration
          searchProviderId: body.searchProviderId,
          searchProviderApiKey: body.searchApiKey,
          
          // Callbacks for this specific company
          onProgress: (data) => {
            sendEvent("company-progress", {
              companyName,
              ...data
            });
          },
          onMessage: (data) => {
            sendEvent("company-message", {
              companyName,
              ...data
            });
          },
          onError: (error) => {
            sendEvent("company-error", {
              companyName,
              error: error.message
            });
          },
        });

        // Run the fast research
        const result = await researcher.runFastResearch();

        // Update the results
        companyResults[companyName] = {
          companyName,
          status: "completed",
          result,
          completedAt: new Date().toISOString(),
          startedAt: companyResults[companyName].startedAt
        };

        // Send completion event for this company
        sendEvent("company-complete", {
          companyName,
          result
        });

        logger.log(`[Bulk Research ${bulkResearchId}] Completed: ${companyName}`);

      } catch (error) {
        console.error(`[Bulk Research ${bulkResearchId}] Error researching ${companyName}:`, error);
        
        // Update the results with error
        companyResults[companyName] = {
          ...companyResults[companyName],
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
          completedAt: new Date().toISOString()
        };

        // Send error event for this company
        sendEvent("company-error", {
          companyName,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    };

    // Step 7: Process companies in batches to avoid overwhelming the system
    const processBatch = async (companies: string[]) => {
      // Run BATCH_SIZE companies in parallel
      const promises = companies.map(company => processCompany(company));
      await Promise.all(promises);
    };

    // Split companies into batches and process them
    const batches = [];
    for (let i = 0; i < body.companies.length; i += BATCH_SIZE) {
      batches.push(body.companies.slice(i, i + BATCH_SIZE));
    }

    // Process each batch sequentially
    for (const batch of batches) {
      await processBatch(batch);
      
      // Send progress update after each batch
      const completed = Object.values(companyResults).filter(r => r.status === "completed").length;
      const errors = Object.values(companyResults).filter(r => r.status === "error").length;
      
      sendEvent("progress", {
        completed,
        errors,
        total: body.companies.length,
        percentage: Math.round((completed + errors) / body.companies.length * 100)
      });
    }

    // Step 8: Send final results
    sendEvent("complete", {
      bulkResearchId,
      totalCompanies: body.companies.length,
      results: Object.values(companyResults),
      summary: {
        completed: Object.values(companyResults).filter(r => r.status === "completed").length,
        errors: Object.values(companyResults).filter(r => r.status === "error").length
      }
    });

    logger.log(`[Bulk Research ${bulkResearchId}] All companies processed`);

    // Add a small delay before closing to ensure all events are sent
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Close the stream
    closeStream();

    // Return the SSE stream to the client
    return new Response(stream, {
      headers: getSSEHeaders(),
    });

  } catch (error) {
    console.error("Bulk company research API error:", error);
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