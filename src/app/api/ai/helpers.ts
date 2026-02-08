import { NextResponse } from "next/server";

export function buildUpstreamURL(
  baseURL: string,
  slugSegments: readonly string[] = [],
  searchParams?: URLSearchParams,
): string {
  const trimmedBase = baseURL.replace(/\/+$/, "");
  const encodedPath = slugSegments
    .flat()
    .filter((segment): segment is string => !!segment && segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  let url = encodedPath.length > 0 ? `${trimmedBase}/${encodedPath}` : trimmedBase;

  if (searchParams) {
    const params = new URLSearchParams(searchParams);
    params.delete("slug");
    const paramsString = params.toString();
    if (paramsString.length > 0) {
      url += `?${paramsString}`;
    }
  }

  return url;
}

// Headers that should NOT be copied from upstream response
// These cause issues with Next.js edge runtime streaming
const FORBIDDEN_HEADERS = new Set([
  "content-encoding",
  "content-length",
  "transfer-encoding",
  "connection",
  "keep-alive",
]);

export function createProxiedResponse(response: Response): NextResponse {
  // Copy only safe headers from upstream response
  const headers = new Headers();
  for (const [key, value] of response.headers.entries()) {
    if (!FORBIDDEN_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  }

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
