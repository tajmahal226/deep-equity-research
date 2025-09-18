import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handler as googleHandler } from "../../src/app/api/ai/google/[...slug]/route";
import { createMockRequest } from "./mocks";

const buildRequest = (slug: string[], search = "") => {
  const url = new URL(
    `https://example.com/api/ai/google/${slug.map(encodeURIComponent).join("/")}${search}`,
  );
  return createMockRequest(url.toString(), {
    method: "POST",
    headers: new Headers({
      "Content-Type": "application/json",
      "x-goog-api-key": "client-key",
    }),
    body: JSON.stringify({ foo: "bar" }),
  });
};

describe("google proxy handler", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 200 })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards encoded slug and query params", async () => {
    const request = buildRequest(["models", "gemini 1.5", "streamGenerate"], "?alt=json");

    await googleHandler(request, { params: { slug: ["models", "gemini 1.5", "streamGenerate"] } });

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (fetch as unknown as vi.Mock).mock.calls[0] as [string, RequestInit];

    expect(url).toBe("https://generativelanguage.googleapis.com/models/gemini%201.5/streamGenerate?alt=json");
    expect(init.headers).toMatchObject({
      "Content-Type": "application/json",
      "x-goog-api-key": "client-key",
    });
  });
});
