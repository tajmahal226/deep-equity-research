import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handler as deepseekHandler } from "../../src/app/api/ai/deepseek/[...slug]/route";
import { createMockRequest } from "./mocks";

const buildRequest = (slug: string[]) => {
  const url = new URL(`https://example.com/api/ai/deepseek/${slug.join("/")}`);
  return createMockRequest(url.toString(), {
    method: "POST",
    headers: new Headers({
      "Content-Type": "application/json",
      Authorization: "Bearer client-key",
    }),
    body: JSON.stringify({ foo: "bar" }),
  });
};

describe("deepseek proxy handler", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 200 })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards slug to deepseek base and preserves headers", async () => {
    const request = buildRequest(["v1", "models", "deepseek-chat", "responses"]);

    await deepseekHandler(request, { params: { slug: ["v1", "models", "deepseek-chat", "responses"] } });

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (fetch as unknown as vi.Mock).mock.calls[0] as [string, RequestInit];

    expect(url).toBe("https://api.deepseek.com/v1/models/deepseek-chat/responses");
    expect(init.headers).toMatchObject({
      "Content-Type": "application/json",
      Authorization: "Bearer client-key",
    });
  });
});
