import { NextResponse, type NextRequest } from "next/server";
import { rateLimit, RATE_LIMITS } from "../middleware/rate-limit";

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

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = rateLimit(req, RATE_LIMITS.CRAWLER);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const { url } = await req.json();
    if (!url) throw new Error("Missing parameters!");

    // Validate URL to prevent SSRF attacks
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { code: 400, message: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { code: 400, message: "Only HTTP and HTTPS protocols are allowed" },
        { status: 400 }
      );
    }

    // Block access to private/internal networks
    const blockedHosts = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '169.254.169.254', // AWS metadata
      '[::1]', // IPv6 localhost
      '::1',
    ];

    const hostname = parsedUrl.hostname.toLowerCase();

    // Check for blocked hosts
    if (blockedHosts.some(blocked => hostname === blocked || hostname.includes(blocked))) {
      return NextResponse.json(
        { code: 403, message: "Access to internal/private networks is not allowed" },
        { status: 403 }
      );
    }

    // Block private IP ranges (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Regex);
    if (ipMatch) {
      const [, a, b] = ipMatch.map(Number);
      if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) {
        return NextResponse.json(
          { code: 403, message: "Access to private IP ranges is not allowed" },
          { status: 403 }
        );
      }
    }

    const response = await fetch(url, { next: { revalidate: 60 } });
    const result = await response.text();

    const titleRegex = /<title>(.*?)<\/title>/i;
    const titleMatch = result.match(titleRegex);
    const title = titleMatch ? titleMatch[1].trim() : "";

    return NextResponse.json({ url, title, content: result });
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
