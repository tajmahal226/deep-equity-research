import { NextResponse, type NextRequest } from "next/server";
import { OPENAI_BASE_URL } from "@/constants/urls";
import { buildUpstreamURL } from "../../helpers";
import { rateLimit, RATE_LIMITS } from "@/app/api/middleware/rate-limit";

const API_PROXY_BASE_URL = process.env.OPENAI_API_BASE_URL || OPENAI_BASE_URL;

/**
 * Map invalid/hypothetical model names to valid OpenAI models.
 * This handles cases where speculative future model names are used
 * that don't actually exist in the OpenAI API.
 */
const MODEL_MAPPING: Record<string, string> = {
  // GPT-5.2 series (hypothetical) -> map to best available
  "gpt-5.2-pro": "o1",
  "gpt-5.2-pro-reasoning": "o1",
  "gpt-5.2-pro-chat": "gpt-4o",
  "gpt-5.2-turbo": "gpt-4o",
  "gpt-5.2-turbo-reasoning": "o1-mini",
  // GPT-5 series (hypothetical) -> map to best available
  "gpt-5": "o1",
  "gpt-5-turbo": "gpt-4o",
  "gpt-5-32k": "gpt-4o",
  "gpt-5-chat-latest": "gpt-4o",
};

/**
 * Normalize model name to a valid OpenAI model
 */
function normalizeModelName(model: string): string {
  // Check if model needs to be mapped to a valid name
  if (MODEL_MAPPING[model]) {
    return MODEL_MAPPING[model];
  }
  return model;
}

type RouteParams = {
  slug?: string[];
};

export async function proxyHandler(
  req: NextRequest,
  context: { params: Promise<RouteParams> },
) {
  const __rl = rateLimit(req, RATE_LIMITS.AI_PROXY);
  if (__rl) return __rl;
  let body;
  if (req.method.toUpperCase() !== "GET") {
    body = await req.json();
  }

  const { slug = [] } = await context.params;
  const slugSegments = slug;
  const searchParams = req.nextUrl.searchParams;
  const isDev = process.env.NODE_ENV !== "production";

  try {
    const url = buildUpstreamURL(API_PROXY_BASE_URL, slugSegments, searchParams);

    // Handle endpoint routing based on model type
    if (body && body.model) {
      const model = body.model;

      // Handle undefined or missing model names
      if (!model || model === "undefined" || model === "") {
        console.error("OpenAI API: Model name is undefined or empty", { body, slug: slugSegments });
        return NextResponse.json(
          { code: 400, message: "Model name is required" },
          { status: 400 }
        );
      }

      // Normalize model name to handle hypothetical/invalid models
      const normalizedModel = normalizeModelName(model);
      if (normalizedModel !== model) {
        if (isDev) {
          console.log(`OpenAI API: Mapped model "${model}" -> "${normalizedModel}"`);
        }
        body.model = normalizedModel;
      }
    }

    // Log final request parameters for debugging
    if (body && body.model && isDev) {
      console.log(`OpenAI API: Final request for ${body.model}`, {
        temperature: body.temperature,
        hasTemperature: "temperature" in body,
        endpoint: url,
      });
    }

    const payload: RequestInit = {
      method: req.method,
      headers: {
        "Content-Type": req.headers.get("Content-Type") || "application/json",
        Authorization: req.headers.get("Authorization") || "",
      },
    };
    if (body) payload.body = JSON.stringify(body);

    const response = await fetch(url, payload);
    return new NextResponse(response.body, response);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`OpenAI API Error: ${error.message}`, { body, slug: slugSegments });
      return NextResponse.json(
        { code: 500, message: error.message },
        { status: 500 }
      );
    }
  }
}
