
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createProxyHandler } from "@/app/api/ai/create-proxy-handler";
import { NextRequest } from "next/server";

// Mock rate limit to always pass
vi.mock("@/app/api/middleware/rate-limit", () => ({
    rateLimit: () => null,
    RATE_LIMITS: { AI_PROXY: {} },
}));

describe("createProxyHandler", () => {
    const baseUrl = "https://api.example.com";
    const handler = createProxyHandler(baseUrl);
    console.log("TEST START: createProxyHandler suite");

    beforeEach(() => {
        vi.clearAllMocks();
        globalThis.fetch = vi.fn();
    });

    it("proxies GET requests correctly", async () => {
        const req = new NextRequest("http://localhost/api/ai/test/v1/models");
        const context = { params: Promise.resolve({ slug: ["v1", "models"] }) };

        (globalThis.fetch as any).mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }));

        const res = await handler(req, context);
        expect(res.status).toBe(200);

        const callArgs = (globalThis.fetch as any).mock.calls[0];
        expect(callArgs[0]).toBe("https://api.example.com/v1/models");
        expect(callArgs[1].method).toBe("GET");
    });

    it("proxies POST requests with body", async () => {
        const req = new NextRequest("http://localhost/api/ai/test/v1/chat/completions", {
            method: "POST",
            body: JSON.stringify({ model: "test" }),
            headers: { "Content-Type": "application/json", "Authorization": "Bearer key" }
        });
        const context = { params: Promise.resolve({ slug: ["v1", "chat", "completions"] }) };

        (globalThis.fetch as any).mockResolvedValue(new Response("{}", { status: 200 }));

        await handler(req, context);

        const callArgs = (globalThis.fetch as any).mock.calls[0];
        expect(callArgs[0]).toBe("https://api.example.com/v1/chat/completions");
        expect(callArgs[1].method).toBe("POST");
        expect(callArgs[1].headers).toEqual({
            "Content-Type": "application/json",
            "Authorization": "Bearer key",
        });
        expect(callArgs[1].body).toBe(JSON.stringify({ model: "test" }));
    });


    it("proxies with custom headers", async () => {
        const handler = createProxyHandler("https://api.example.com", {
            headers: (req) => ({
                "x-custom-key": req.headers.get("x-header") || "fallback",
            }),
        });
        const req = new NextRequest("http://localhost/api/ai/test/v1/models", {
            headers: { "x-header": "custom-value" },
        });
        const context = { params: Promise.resolve({ slug: ["v1", "models"] }) };
        (globalThis.fetch as any).mockResolvedValue(new Response("{}", { status: 200 }));

        await handler(req, context);

        const callArgs = (globalThis.fetch as any).mock.calls[0];
        expect(callArgs[0]).toBe("https://api.example.com/v1/models");
        expect(callArgs[1].headers).toEqual({
            "Content-Type": "application/json",
            "Authorization": "",
            "x-custom-key": "custom-value",
        });
    });


    it("modifies body and slug via preprocess hook", async () => {
        const handler = createProxyHandler("https://api.example.com", {
            preprocess: async (body, slug) => {
                return {
                    body: { ...body, modified: true },
                    slug: ["v2", ...slug],
                };
            },
        });

        const req = new NextRequest("http://localhost/api/ai/test/v1/chat", {
            method: "POST",
            body: JSON.stringify({ original: true }),
        });
        const context = { params: Promise.resolve({ slug: ["v1", "chat"] }) };

        (globalThis.fetch as any).mockResolvedValue(new Response("{}", { status: 200 }));

        await handler(req, context);

        const callArgs = (globalThis.fetch as any).mock.calls[0];
        expect(callArgs[0]).toBe("https://api.example.com/v2/v1/chat");
        expect(JSON.parse(callArgs[1].body)).toEqual({ original: true, modified: true });
    });
});
