import { NextResponse, type NextRequest } from "next/server";
import DeepResearch from "@/utils/deep-research";
import { multiApiKeyPolling } from "@/utils/model";
import {
  getAIProviderBaseURL,
  getSearchProviderBaseURL,
} from "../../utils";
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

export async function GET(req: NextRequest) {
  // Get parameters from query string
  function getValueFromSearchParams(key: string) {
    return req.nextUrl.searchParams.get(key);
  }
  
  const query = getValueFromSearchParams("query") || "";
  const provider = getValueFromSearchParams("provider") || "";
  const thinkingModel = getValueFromSearchParams("thinkingModel") || "";
  const taskModel = getValueFromSearchParams("taskModel") || "";
  const searchProvider = getValueFromSearchParams("searchProvider") || "";
  const language = getValueFromSearchParams("language") || "";
  const maxResult = Number(getValueFromSearchParams("maxResult")) || 5;
  const enableCitationImage =
    getValueFromSearchParams("enableCitationImage") !== "false";
  const enableReferences =
    getValueFromSearchParams("enableReferences") !== "false";
  
  // Client-side API keys (required via query params)
  const aiApiKey = getValueFromSearchParams("aiApiKey") || "";
  const searchApiKey = getValueFromSearchParams("searchApiKey") || "";

  // Step 3: Validate that user provided API keys
  if (!aiApiKey && provider !== "ollama") {
    return NextResponse.json(
      { 
        code: 400, 
        message: `API key required for ${provider}. Please provide aiApiKey parameter.` 
      },
      { status: 400 }
    );
  }

  if (!searchApiKey && searchProvider !== "model" && searchProvider !== "searxng") {
    return NextResponse.json(
      { 
        code: 400, 
        message: `Search API key required for ${searchProvider}. Please provide searchApiKey parameter.` 
      },
      { status: 400 }
    );
  }

  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    start: async (controller) => {
      logger.log("Client connected");

      req.signal.addEventListener("abort", () => {
        logger.log("Client disconnected");
      });

      const deepResearch = new DeepResearch({
        language,
        AIProvider: {
          baseURL: getAIProviderBaseURL(provider),
          apiKey: multiApiKeyPolling(aiApiKey),
          provider,
          thinkingModel,
          taskModel,
        },
        searchProvider: {
          baseURL: getSearchProviderBaseURL(searchProvider),
          apiKey: multiApiKeyPolling(searchApiKey),
          provider: searchProvider,
          maxResult,
        },
        onMessage: (event, data) => {
          if (event === "message") {
            controller.enqueue(encoder.encode(data.text));
          } else if (event === "progress") {
            logger.log(
              `[${data.step}]: ${data.name ? `"${data.name}" ` : ""}${
                data.status
              }`
            );
            if (data.step === "final-report" && data.status === "end") {
              controller.close();
            }
          } else if (event === "error") {
            console.error(data);
            controller.close();
          }
        },
      });

      req.signal.addEventListener("abort", () => {
        controller.close();
      });

      try {
        await deepResearch.start(query, enableCitationImage, enableReferences);
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : "Unknown error");
      }
      controller.close();
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
