import { beforeEach, describe, expect, it, vi } from "vitest";

const startSpy = vi.fn();

vi.mock("@/utils/deep-research", () => {
  return {
    default: class MockDeepResearch {
      private readonly options: any;

      constructor(options: any) {
        this.options = options;
      }

      async start() {
        startSpy();
        const { onMessage } = this.options;
        onMessage?.("progress", {
          step: "report-plan",
          status: "start",
          name: "initial-plan",
        });
        onMessage?.("progress", {
          step: "final-report",
          status: "end",
          name: "final-report",
        });
        // Emit an additional message after the final report to ensure the
        // handler ignores post-close events without throwing.
        onMessage?.("progress", {
          step: "cleanup",
          status: "start",
        });
      }
    },
  };
});

import { POST } from "@/app/api/sse/route";

describe("POST /api/sse", () => {
  beforeEach(() => {
    startSpy.mockClear();
  });

  it("delivers the final progress event before closing the stream", async () => {
    const abortController = new AbortController();
    const request = {
      json: vi.fn().mockResolvedValue({
        query: "test query",
        provider: "openai",
        thinkingModel: "gpt-4.1",
        taskModel: "gpt-4.1-mini",
        searchProvider: "tavily",
        language: "en",
        maxResult: 3,
        enableCitationImage: true,
        enableReferences: true,
        temperature: 0.7,
      }),
      signal: abortController.signal,
    } as any;

    const response = await POST(request);

    expect(response.body).toBeInstanceOf(ReadableStream);

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let output = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      output += decoder.decode(value, { stream: true });
    }
    output += decoder.decode();

    const events = output
      .split("\n\n")
      .map((chunk) => chunk.trim())
      .filter(Boolean);

    expect(events.length).toBeGreaterThanOrEqual(3);

    const finalEvent = events[events.length - 1];
    expect(finalEvent).toContain("event: progress");
    expect(finalEvent).toContain("\"step\":\"final-report\"");
    expect(finalEvent).toContain("\"status\":\"end\"");
    expect(output).not.toContain("\"step\":\"cleanup\"");

    expect(startSpy).toHaveBeenCalledTimes(1);
  });
});
