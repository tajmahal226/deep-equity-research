import { NextResponse, type NextRequest } from "next/server";
import { OPENAI_BASE_URL } from "@/constants/urls";
import { buildUpstreamURL } from "../../helpers";
import { rateLimit, RATE_LIMITS } from "@/app/api/middleware/rate-limit";

const API_PROXY_BASE_URL = process.env.OPENAI_API_BASE_URL || OPENAI_BASE_URL;

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
    let url = buildUpstreamURL(API_PROXY_BASE_URL, slugSegments, searchParams);

    // Handle endpoint routing based on model type
    if (body && body.model) {
      const model = body.model;
      const currentEndpoint = slugSegments.join("/");

      // Normalize model name for consistent checking
      const normalizedModel = model.toLowerCase().replace(/\s+/g, "-");

      // Handle undefined or missing model names
      if (!model || model === "undefined" || model === "") {
        console.error("OpenAI API: Model name is undefined or empty", { body, slug: slugSegments });
        return NextResponse.json(
          { code: 400, message: "Model name is required" },
          { status: 400 }
        );
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
