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
  
  // Search provider settings
  searchProviderId?: string;
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
    console.log(`[Company Research ${researchId}] Starting research for: ${body.companyName}`);

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
      
      // AI provider configuration
      // If not specified, the CompanyDeepResearch class will use defaults
      thinkingModelConfig: body.thinkingModelId && body.thinkingProviderId ? {
        modelId: body.thinkingModelId,
        providerId: body.thinkingProviderId,
      } : undefined,
      
      taskModelConfig: body.taskModelId && body.taskProviderId ? {
        modelId: body.taskModelId,
        providerId: body.taskProviderId,
      } : undefined,
      
      // Search provider configuration
      searchProviderId: body.searchProviderId,
      
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

    // Step 6: Run the research based on the selected depth
    // This is where the magic happens!
    try {
      let result;
      
      switch (body.searchDepth) {
        case "fast":
          // Fast mode: Direct AI response, no web searches
          // Perfect for quick overviews or when you're in a hurry
          console.log(`[Company Research ${researchId}] Running fast research`);
          result = await researcher.runFastResearch();
          break;
          
        case "medium":
          // Medium mode: Limited searches focusing on key areas
          // Good balance between speed and depth
          console.log(`[Company Research ${researchId}] Running medium research`);
          result = await researcher.runMediumResearch();
          break;
          
        case "deep":
          // Deep mode: Comprehensive research with all investment sections
          // Use this when preparing for important meetings or decisions
          console.log(`[Company Research ${researchId}] Running deep research`);
          result = await researcher.runDeepResearch();
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

      console.log(`[Company Research ${researchId}] Research completed successfully`);
      
    } catch (error) {
      // Handle any errors during research
      console.error(`[Company Research ${researchId}] Error:`, error);
      sendEvent("error", { 
        message: error instanceof Error ? error.message : "Unknown error occurred",
        researchId: researchId 
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