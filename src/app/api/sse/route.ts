import { NextResponse, type NextRequest } from "next/server";
import DeepResearch from "@/utils/deep-research";
import { multiApiKeyPolling } from "@/utils/model";
import {
  getAIProviderBaseURL,
  getSearchProviderBaseURL,
} from "../utils";
import { logger } from "@/utils/logger";

// Remove edge runtime to support long-running SSE connections
// Edge runtime has 25-30 second timeout which is too short for research
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes (Vercel Hobby max)
export const preferredRegion = [
  "cle1",
  "iad1",
  "pdx1",
  "sfo1",
  "sin1",
  "syd1",
  "hnd1",
  "kix1",
];

/**
 * POST handler for general deep research via SSE.
 *
 * @param req - The NextRequest object.
 * @returns An SSE response stream.
 */
export async function POST(req: NextRequest) {
  // Check for ACCESS_PASSWORD if configured
  const accessPassword = process.env.ACCESS_PASSWORD;
  if (accessPassword) {
    const authHeader = req.headers.get("Authorization");
    const providedPassword = authHeader?.replace("Bearer ", "") ||
                            new URL(req.url).searchParams.get("access_password");

    if (providedPassword !== accessPassword) {
      return new Response("Unauthorized", { status: 403 });
    }
  }

  // Parse request body
  const {
    query,
    provider,
    thinkingModel,
    taskModel,
    searchProvider,
    language,
    maxResult,
    enableCitationImage = true,
    enableReferences = true,
    temperature = 0.7,
    // Client-side API keys (required)
    aiApiKey,
    searchApiKey,
  } = await req.json();

  // Validate that user provided API keys
  if (!aiApiKey && provider !== "ollama") {
    return NextResponse.json(
      { 
        code: 400, 
        message: `API key required for ${provider}. Please configure your API key in Settings.` 
      },
      { status: 400 }
    );
  }

  if (!searchApiKey && searchProvider !== "model" && searchProvider !== "searxng") {
    return NextResponse.json(
      { 
        code: 400, 
        message: `Search API key required for ${searchProvider}. Please configure your search provider API key in Settings.` 
      },
      { status: 400 }
    );
  }

  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    start: async (controller) => {
      logger.log("Client connected");
      let streamClosed = false;

      const closeStream = () => {
        if (streamClosed) {
          return;
        }
        streamClosed = true;
        controller.close();
      };

      const enqueueEvent = (event: string, data: any) => {
        if (streamClosed) {
          return;
        }
        controller.enqueue(
          encoder.encode(
            `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
          )
        );
      };

      enqueueEvent("info", {
        name: "deep-research",
        version: "0.1.0",
      });

      const deepResearch = new DeepResearch({
        language,
        AIProvider: {
          baseURL: getAIProviderBaseURL(provider),
          apiKey: multiApiKeyPolling(aiApiKey),
          provider,
          thinkingModel,
          taskModel,
          temperature,
        },
        searchProvider: {
          baseURL: getSearchProviderBaseURL(searchProvider),
          apiKey: multiApiKeyPolling(searchApiKey),
          provider: searchProvider,
          maxResult,
        },
        onMessage: (event, data) => {
          if (streamClosed) {
            return;
          }
          if (event === "progress") {
            logger.log(
              `[${data.step}]: ${data.name ? `"${data.name}" ` : ""}${
                data.status
              }`
            );
            enqueueEvent(event, data);
            if (data.step === "final-report" && data.status === "end") {
              closeStream();
            }
            return;
          } else if (event === "error") {
            console.error(data);
            enqueueEvent(event, data);
            closeStream();
            return;
          }
          console.warn(`Unknown event: ${event}`);
          enqueueEvent(event, data);
        },
      });

      req.signal.addEventListener("abort", () => {
        closeStream();
      });

      try {
        await deepResearch.start(query, enableCitationImage, enableReferences);
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : "Unknown error");
      } finally {
        closeStream();
      }
    },
  });

  return new NextResponse(readableStream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
