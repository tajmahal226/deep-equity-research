import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handler as openaiHandler } from "../../src/app/api/ai/openai/[...slug]/route";
import { createMockRequest } from "./mocks";

const buildRequest = (init: {
  method?: string;
  body?: Record<string, unknown> | null;
  slug?: string[];
  headers?: Record<string, string>;
  search?: string;
} = {}) => {
  const {
    method = "POST",
    body = {},
    slug = ["chat", "completions"],
    headers = {},
    search = "",
  } = init;

  const url = new URL(
    `https://example.com/api/ai/openai/${slug.map(encodeURIComponent).join("/")}${search}`,
  );

  const requestInit: RequestInit = {
    method,
    headers: new Headers({
      "Content-Type": "application/json",
      Authorization: "Bearer test",
      ...headers,
    }),
  };

  if (method.toUpperCase() !== "GET" && body !== null) {
    requestInit.body = JSON.stringify(body);
  }

  return createMockRequest(url.toString(), requestInit);
};

describe("openai proxy handler", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 200 })));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("rewrites chat completions endpoint for o3 models", async () => {
    const request = buildRequest({
      slug: ["v1", "chat", "completions"],
      body: {
        model: "o3-mini",
        messages: [
          { role: "system", content: "You are helpful" },
          { role: "user", content: "Hi" },
        ],
      },
    });

    await openaiHandler(request, { params: { slug: ["v1", "chat", "completions"] } });

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (fetch as unknown as vi.Mock).mock.calls[0] as [string, RequestInit];

    expect(url).toBe("https://api.openai.com/v1/completions");
    expect(init.method).toBe("POST");

    const parsedBody = JSON.parse(init.body as string);
    expect(parsedBody.prompt).toContain("System: You are helpful");
    expect(parsedBody.prompt).toContain("Human: Hi");
    expect(parsedBody.messages).toBeUndefined();
  });

  it("removes temperature for reasoning models", async () => {
    const request = buildRequest({
      body: {
        model: "gpt-5",
        temperature: 0.2,
      },
      slug: ["v1", "responses"],
    });

    await openaiHandler(request, { params: { slug: ["v1", "responses"] } });

    const [url, init] = (fetch as unknown as vi.Mock).mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.openai.com/v1/responses");

    const parsedBody = JSON.parse(init.body as string);
    expect(parsedBody.temperature).toBeUndefined();
  });
});
