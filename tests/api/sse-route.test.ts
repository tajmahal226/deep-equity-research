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
  beforeEach(() => {
    startMock.mockReset();
    startMock.mockResolvedValue(undefined);
  });

  it("emits an initial info event with version details", async () => {
    const request = new NextRequest("http://localhost/api/sse", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        query: "test question",
        provider: "openai",
        thinkingModel: "gpt-4o",
        taskModel: "gpt-4o",
        searchProvider: "tavily",
        language: "en-US",
        maxResult: 3,
        aiApiKey: "test-key",
        searchApiKey: "search-key",
      }),
    });

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
});
