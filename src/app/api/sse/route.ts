import { NextResponse, type NextRequest } from "next/server";
import DeepResearch from "@/utils/deep-research";
import { multiApiKeyPolling } from "@/utils/model";
import {
  getAIProviderBaseURL,
  getAIProviderApiKey,
  getSearchProviderBaseURL,
  getSearchProviderApiKey,
} from "../utils";
import { logger } from "@/utils/logger";

export const runtime = "edge";
export const dynamic = "force-dynamic";
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

export async function POST(req: NextRequest) {
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
    // Client-side API keys
    aiApiKey,
    searchApiKey,
  } = await req.json();

  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    start: async (controller) => {
      logger.log("Client connected");
      controller.enqueue(
        encoder.encode(
          `event: infor\ndata: ${JSON.stringify({
            name: "deep-research",
            version: "0.1.0",
          })}\n\n`
        )
      );

      const deepResearch = new DeepResearch({
        language,
        AIProvider: {
          baseURL: getAIProviderBaseURL(provider),
          apiKey: multiApiKeyPolling(aiApiKey || getAIProviderApiKey(provider)),
          provider,
          thinkingModel,
          taskModel,
          temperature,
        },
        searchProvider: {
          baseURL: getSearchProviderBaseURL(searchProvider),
          apiKey: multiApiKeyPolling(searchApiKey || getSearchProviderApiKey(searchProvider)),
          provider: searchProvider,
          maxResult,
        },
        onMessage: (event, data) => {
          if (event === "progress") {
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
          } else {
            console.warn(`Unknown event: ${event}`);
          }
          controller.enqueue(
            encoder.encode(
              `event: ${event}\ndata: ${JSON.stringify(data)})}\n\n`
            )
          );
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
