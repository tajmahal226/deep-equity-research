import { NextRequest, NextResponse } from "next/server";
import { jinaReader } from "@/utils/crawler";

/**
 * POST handler for the web crawler API.
 *
 * @param req - The NextRequest object.
 * @returns The crawled content.
 */
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
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
