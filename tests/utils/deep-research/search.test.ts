import { afterEach, describe, expect, it, vi } from "vitest";

import { createSearchProvider } from "@/utils/deep-research/search";

describe("createSearchProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("throws a descriptive error when the provider responds with 500", async () => {
    const errorBody = JSON.stringify({ error: "Internal Server Error" });
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(errorBody, {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      );

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createSearchProvider({
        provider: "tavily",
        query: "climate change",
      })
    ).rejects.toThrowError(
      /\[tavily\] Request failed with status 500: .*Internal Server Error/
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
