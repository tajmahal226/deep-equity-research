import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../../src/app/api/sse/route";

const startMock = vi.fn();

vi.mock("@/utils/deep-research", () => {
  const DeepResearchMock = vi.fn().mockImplementation(() => ({
    start: startMock,
  }));

  return {
    __esModule: true,
    default: DeepResearchMock,
  };
});

vi.mock("@/utils/model", () => ({
  multiApiKeyPolling: vi.fn((key: string) => key),
}));

describe("POST /api/sse", () => {
  const basePayload = {
    query: "test question",
    provider: "openai",
    thinkingModel: "gpt-4o",
    taskModel: "gpt-4o",
    searchProvider: "tavily",
    language: "en-US",
    maxResult: 3,
    aiApiKey: "test-key",
    searchApiKey: "search-key",
  };

  const originalAccessPassword = process.env.ACCESS_PASSWORD;

  const resetAccessPassword = () => {
    if (originalAccessPassword === undefined) {
      delete process.env.ACCESS_PASSWORD;
    } else {
      process.env.ACCESS_PASSWORD = originalAccessPassword;
    }
  };

  beforeEach(() => {
    startMock.mockReset();
    startMock.mockResolvedValue(undefined);
    resetAccessPassword();
  });

  const createRequest = (payload = basePayload, headers: Record<string, string> = {}) =>
    new NextRequest("http://localhost/api/sse", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...headers,
      },
      body: JSON.stringify(payload),
    });

  it("emits an initial info event with version details", async () => {
    const request = createRequest();

    const response = await POST(request);
    const reader = response.body?.getReader();
    expect(reader).toBeDefined();

    const decoder = new TextDecoder();
    let payload = "";

    while (true) {
      const { value, done } = await reader!.read();
      if (done) break;
      payload += decoder.decode(value, { stream: true });
    }

    payload += decoder.decode();

    const events = payload
      .split("\n\n")
      .map((event) => event.trim())
      .filter(Boolean);

    const [infoEvent] = events;
    const infoLines = infoEvent.split("\n");

    expect(infoLines[0]).toBe("event: info");

    const dataLine = infoLines.find((line) => line.startsWith("data:"));
    const infoData = JSON.parse(dataLine?.replace("data: ", "") || "{}");

    expect(infoData).toEqual({ name: "deep-research", version: "0.1.0" });
  });

  it("returns 403 when ACCESS_PASSWORD is set and not provided", async () => {
    process.env.ACCESS_PASSWORD = "secret";

    const response = await POST(createRequest());

    expect(response.status).toBe(403);
    expect(await response.text()).toBe("Unauthorized");
    expect(startMock).not.toHaveBeenCalled();
  });

  it("returns 400 when AI API key is missing for provider", async () => {
    const payload = { ...basePayload, aiApiKey: undefined };
    const response = await POST(createRequest(payload));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: 400,
      message: "API key required for openai. Please configure your API key in Settings.",
    });
    expect(startMock).not.toHaveBeenCalled();
  });

  it("returns 400 when search API key is missing for provider", async () => {
    const payload = { ...basePayload, searchApiKey: undefined };
    const response = await POST(createRequest(payload));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: 400,
      message:
        "Search API key required for tavily. Please configure your search provider API key in Settings.",
    });
    expect(startMock).not.toHaveBeenCalled();
  });

  it("accepts valid access password and proceeds", async () => {
    process.env.ACCESS_PASSWORD = "secret";
    const response = await POST(
      createRequest(basePayload, { Authorization: "Bearer secret" })
    );

    expect(response.status).toBe(200);
    expect(startMock).toHaveBeenCalledTimes(1);
  });
});
