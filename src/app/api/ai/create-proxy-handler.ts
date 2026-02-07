import { NextResponse, type NextRequest } from "next/server";
import { buildUpstreamURL, createProxiedResponse } from "./helpers";
import { rateLimit, RATE_LIMITS } from "@/app/api/middleware/rate-limit";

type RouteParams = {
    slug?: string[];
};

export type ProxyOptions = {
    headers?: (req: NextRequest) => Record<string, string>;
    preprocess?: (body: any, slug: string[]) => { body: any; slug: string[] } | Promise<{ body: any; slug: string[] }>;
};

export function createProxyHandler(apiBaseUrl: string, options: ProxyOptions = {}) {
    return async function handler(
        req: NextRequest,
        context: { params: Promise<RouteParams> }
    ) {
        const __rl = rateLimit(req, RATE_LIMITS.AI_PROXY);
        if (__rl) return __rl;

        let body;
        if (req.method.toUpperCase() !== "GET") {
            try {
                body = await req.json();
            } catch {
                // Body might be empty or invalid JSON
            }
        }

        const { slug: initialSlug = [] } = await context.params;
        let slug = initialSlug;

        if (options.preprocess) {
            const result = await options.preprocess(body, slug);
            body = result.body;
            slug = result.slug;
        }

        try {
            const url = buildUpstreamURL(
                apiBaseUrl,
                slug,
                req.nextUrl.searchParams
            );

            const customHeaders = options.headers ? options.headers(req) : {};

            const payload: RequestInit = {
                method: req.method,
                headers: {
                    "Content-Type": req.headers.get("Content-Type") || "application/json",
                    Authorization: req.headers.get("Authorization") || "",
                    ...customHeaders,
                },
            };

            if (body) payload.body = JSON.stringify(body);

            const response = await fetch(url, payload);
            return createProxiedResponse(response);
        } catch (error) {
            if (error instanceof Error) {
                console.error(error);
                return NextResponse.json(
                    { code: 500, message: error.message },
                    { status: 500 }
                );
            }
            return NextResponse.json(
                { code: 500, message: "Unknown error" },
                { status: 500 }
            );
        }
    };
}

