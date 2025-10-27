import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  nextResponseNextMock,
  nextResponseJsonMock,
  multiApiKeyPollingMock,
  getCustomModelListMock,
  verifySignatureMock,
} = vi.hoisted(() => ({
  nextResponseNextMock: vi.fn((init?: { request?: { headers?: Headers } }) => ({
    type: "next",
    init,
  })),
  nextResponseJsonMock: vi.fn(
    (body: unknown, init?: ResponseInit) => ({
      type: "json",
      body,
      init,
    }),
  ),
  multiApiKeyPollingMock: vi.fn(() => "proxied-api-key"),
  getCustomModelListMock: vi.fn(() => ({
    availableModelList: [],
    disabledModelList: [],
  })),
  verifySignatureMock: vi.fn(() => true),
}));

vi.mock("next/server", () => {
  class LocalNextRequest {
    url: string;
    method: string;
    headers: Headers;
    private bodyValue: string | null;
    nextUrl: URL;

    constructor(url: string, init: RequestInit = {}) {
      this.url = url;
      this.method = (init.method || "GET").toUpperCase();
      this.headers = new Headers(init.headers);
      const body = init.body;
      if (typeof body === "string") {
        this.bodyValue = body;
      } else if (body == null) {
        this.bodyValue = null;
      } else if (body instanceof URLSearchParams) {
        this.bodyValue = body.toString();
      } else {
        this.bodyValue = null;
      }
      this.nextUrl = new URL(url);
    }

    async text() {
      return this.bodyValue ?? "";
    }
  }

  return {
    NextRequest: LocalNextRequest,
    NextResponse: {
      next: nextResponseNextMock,
      json: nextResponseJsonMock,
    },
  };
});

vi.mock("@/utils/model", () => ({
  getCustomModelList: getCustomModelListMock,
  multiApiKeyPolling: multiApiKeyPollingMock,
}));

vi.mock("@/utils/signature", () => ({
  verifySignature: verifySignatureMock,
}));

import { NextRequest as MockNextRequest } from "next/server";
import { middleware } from "../../src/middleware";

const buildRequest = (init: {
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  method?: string;
  pathname?: string;
} = {}) => {
  const {
    headers = {},
    body = { model: "gpt-4o" },
    method = "POST",
    pathname = "/api/ai/openai/v1/chat/completions",
  } = init;

  const url = new URL(`https://example.com${pathname}`);

  return new MockNextRequest(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer signed-token",
      ...headers,
    },
    body: JSON.stringify(body),
  });
};

describe("middleware header forwarding", () => {
  beforeEach(() => {
    nextResponseNextMock.mockClear();
    nextResponseJsonMock.mockClear();
    multiApiKeyPollingMock.mockClear();
    getCustomModelListMock.mockClear();
    verifySignatureMock.mockClear();
  });

  it("preserves custom headers when forwarding openai requests", async () => {
    const request = buildRequest({
      headers: {
        "OpenAI-Beta": "assistants=v2",
        "X-Custom-Meta": "keep-me",
      },
    });

    await middleware(request as unknown as any);

    expect(nextResponseNextMock).toHaveBeenCalledTimes(1);

    const nextOptions = nextResponseNextMock.mock.calls[0][0];
    expect(nextOptions?.request?.headers).toBeInstanceOf(Headers);
    const forwardedHeaders = nextOptions.request.headers as Headers;

    expect(forwardedHeaders.get("openai-beta")).toBe("assistants=v2");
    expect(forwardedHeaders.get("x-custom-meta")).toBe("keep-me");
    expect(forwardedHeaders.get("authorization")).toBe("Bearer proxied-api-key");
  });
});
