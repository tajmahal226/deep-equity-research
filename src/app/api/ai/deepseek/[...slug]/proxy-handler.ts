import { NextResponse, type NextRequest } from "next/server";
import { DEEPSEEK_BASE_URL } from "@/constants/urls";
import { buildUpstreamURL } from "../../helpers";

const API_PROXY_BASE_URL = process.env.DEEPSEEK_API_BASE_URL || DEEPSEEK_BASE_URL;

type RouteParams = {
  slug?: string[];
};

export async function proxyHandler(
  req: NextRequest,
  context: { params: Promise<RouteParams> },
) {
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
        Authorization: req.headers.get("Authorization") || "",
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
