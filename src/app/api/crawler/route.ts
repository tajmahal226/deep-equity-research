import { NextRequest, NextResponse } from "next/server";
import { jinaReader } from "@/utils/crawler";

const BLOCKED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "169.254.169.254"];
const ALLOWED_PROTOCOLS = ["http:", "https:"];

/**
 * Validates a URL to prevent SSRF attacks.
 * Blocks internal IPs, localhost, and private IP ranges.
 *
 * @param urlString - The URL to validate.
 * @returns True if the URL is safe to crawl, false otherwise.
 */
function validateUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    // Block dangerous protocols
    if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
      return false;
    }

    // Block internal IPs and localhost
    if (BLOCKED_HOSTS.includes(url.hostname)) {
      return false;
    }

    // Block private IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
    const hostname = url.hostname;
    if (
      /^10\./.test(hostname) ||
      /^172\.(1[6-9]|2[0-9]|3[01])\./.test(hostname) ||
      /^192\.168\./.test(hostname)
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * POST handler for the web crawler API.
 *
 * @param req - The NextRequest object.
 * @returns The crawled content.
 */
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Valid URL is required" }, { status: 400 });
    }

    if (!validateUrl(url)) {
      return NextResponse.json(
        { error: "Invalid or blocked URL" },
        { status: 403 }
      );
    }

    const result = await jinaReader(url);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Crawler error:", error);
    return NextResponse.json(
      { error: "Failed to crawl URL" },
      { status: 500 }
    );
  }
}
