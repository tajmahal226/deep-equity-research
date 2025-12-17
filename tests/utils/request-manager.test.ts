import { afterEach, describe, expect, it, vi } from "vitest";
import { requestManager } from "@/utils/request-manager";

describe("RequestManager", () => {
  afterEach(() => {
    requestManager.reset();
  });

  it("deduplicates identical requests and shares results", async () => {
    const requestFn = vi.fn((signal: AbortSignal) => {
      expect(signal.aborted).toBe(false);
      return new Promise<string>(resolve => {
        setTimeout(() => resolve("data"), 10);
      });
    });

    const firstPromise = requestManager.deduplicateRequest(
      "endpoint",
      { id: 1 },
      requestFn
    );
    const secondPromise = requestManager.deduplicateRequest(
      "endpoint",
      { id: 1 },
      requestFn
    );

    const [firstResult, secondResult] = await Promise.all([
      firstPromise,
      secondPromise,
    ]);

    expect(firstResult).toBe("data");
    expect(secondResult).toBe("data");
    expect(requestFn).toHaveBeenCalledTimes(1);
  });

  it("aborts pending requests when abortRequests is called", async () => {
    const requestFn = vi.fn((signal: AbortSignal) => {
      return new Promise<string>((resolve, reject) => {
        signal.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });

        setTimeout(() => resolve("finished"), 50);
      });
    });

    const pendingPromise = requestManager.deduplicateRequest(
      "endpoint",
      { id: 1 },
      requestFn
    );

    requestManager.abortRequests("endpoint");

    await expect(pendingPromise).rejects.toBeInstanceOf(DOMException);
    expect(requestFn).toHaveBeenCalledTimes(1);
    expect(requestManager.getPendingCount()).toBe(0);
  });

  it("shares abort rejections across deduplicated requests", async () => {
    const requestFn = vi.fn((signal: AbortSignal) => {
      return new Promise<string>((resolve, reject) => {
        signal.addEventListener("abort", () => {
          const abortError = new Error("Aborted");
          abortError.name = "AbortError";
          reject(abortError);
        });

        setTimeout(() => resolve("finished"), 50);
      });
    });

    const firstPromise = requestManager.deduplicateRequest(
      "endpoint",
      { id: 1 },
      requestFn
    );
    const secondPromise = requestManager.deduplicateRequest(
      "endpoint",
      { id: 1 },
      requestFn
    );

    requestManager.abortRequests("endpoint");

    const results = await Promise.allSettled([firstPromise, secondPromise]);

    expect(results).toEqual([
      expect.objectContaining({ status: "rejected" }),
      expect.objectContaining({ status: "rejected" }),
    ]);
    expect(requestFn).toHaveBeenCalledTimes(1);
    expect(requestManager.getPendingCount()).toBe(0);
  });

  it("runs queued requests sequentially for the same queueName", async () => {
    const events: string[] = [];

    const firstPromise = requestManager.sequentialRequest(
      "queue",
      async () => {
        events.push("first-start");
        await new Promise(resolve => setTimeout(resolve, 30));
        events.push("first-end");
        return "first";
      }
    );

    const secondPromise = requestManager.sequentialRequest(
      "queue",
      async () => {
        events.push("second-start");
        events.push("second-end");
        return "second";
      }
    );

    // Allow the first request to start and finish before the second begins
    await Promise.all([firstPromise, secondPromise]);

    expect(events).toEqual([
      "first-start",
      "first-end",
      "second-start",
      "second-end",
    ]);
  });

  it("does not advance active sequence numbers until a request completes", async () => {
    const timestamps: Record<string, number> = {};

    const firstPromise = requestManager.sequentialRequest(
      "queue",
      async () => {
        timestamps["first-start"] = Date.now();
        await new Promise(resolve => setTimeout(resolve, 40));
        timestamps["first-end"] = Date.now();
      }
    );

    const secondPromise = requestManager.sequentialRequest(
      "queue",
      async () => {
        timestamps["second-start"] = Date.now();
      }
    );

    await Promise.all([firstPromise, secondPromise]);

    expect(timestamps["second-start"]).toBeGreaterThanOrEqual(
      timestamps["first-end"]
    );
  });
});
