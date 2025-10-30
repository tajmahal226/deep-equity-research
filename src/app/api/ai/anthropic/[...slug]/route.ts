import { NextResponse, type NextRequest } from "next/server";
import { ANTHROPIC_BASE_URL } from "@/constants/urls";
import { buildUpstreamURL } from "../../helpers";
import { rateLimit, RATE_LIMITS } from "@/app/api/middleware/rate-limit";

export const runtime = "edge";
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

const API_PROXY_BASE_URL =
  process.env.ANTHROPIC_API_BASE_URL || ANTHROPIC_BASE_URL;

type RouteParams = {
  slug?: string[];
};

async function handler(
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

  try {
    const url = buildUpstreamURL(
      API_PROXY_BASE_URL,
      slugSegments,
      req.nextUrl.searchParams,
    );
    const payload: RequestInit = {
      method: req.method,
      headers: {
        "Content-Type": req.headers.get("Content-Type") || "application/json",
        "x-api-key": req.headers.get("x-api-key") || "",
        "anthropic-version":
          req.headers.get("anthropic-version") || "2023-06-01",
      },
    };
    if (body) payload.body = JSON.stringify(body);
    const response = await fetch(url, payload);
    return new NextResponse(response.body, response);
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return NextResponse.json(
        { code: 500, message: error.message },
        { status: 500 }
      );
    }
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE };
