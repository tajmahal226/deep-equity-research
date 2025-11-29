import { afterEach, describe, expect, it, vi } from "vitest";
import { requestManager } from "@/utils/request-manager";

describe("RequestManager", () => {
  afterEach(() => {
    requestManager.reset();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("passes the abort signal to deduplicated requests", async () => {
    vi.useFakeTimers();

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

    await vi.runAllTimersAsync();
    const [firstResult, secondResult] = await Promise.all([
      firstPromise,
      secondPromise,
    ]);

    expect(firstResult).toBe("data");
    expect(secondResult).toBe("data");
    expect(requestFn).toHaveBeenCalledTimes(1);
  });

  it("aborts pending requests when abortRequests is called", async () => {
    vi.useFakeTimers();

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

    const pendingPromise = requestManager.deduplicateRequest(
      "endpoint",
      { id: 1 },
      requestFn
    );

    const pendingExpectation = expect(pendingPromise).rejects.toMatchObject({
      name: "AbortError",
    });

    requestManager.abortRequests("endpoint");

    await pendingExpectation;
    await vi.runAllTimersAsync();
    expect(requestFn).toHaveBeenCalledTimes(1);
    expect(requestManager.getPendingCount()).toBe(0);
  });

  it("shares abort rejections across deduplicated requests", async () => {
    vi.useFakeTimers();

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

    const resultPromise = Promise.allSettled([firstPromise, secondPromise]);
    requestManager.abortRequests("endpoint");

    await vi.runAllTimersAsync();
    const results = await resultPromise;

    expect(results).toEqual([
      expect.objectContaining({ status: "rejected" }),
      expect.objectContaining({ status: "rejected" }),
    ]);
    expect(requestFn).toHaveBeenCalledTimes(1);
    expect(requestManager.getPendingCount()).toBe(0);
  });

  it("only aborts requests matching the provided endpoint", async () => {
    vi.useFakeTimers();

    const abortedFn = vi.fn((signal: AbortSignal) => {
      return new Promise<string>((_resolve, reject) => {
        signal.addEventListener("abort", () => {
          const abortError = new Error("Aborted");
          abortError.name = "AbortError";
          reject(abortError);
        });

        setTimeout(() => reject(new Error("should have aborted")), 50);
      });
    });

    const completedFn = vi.fn((signal: AbortSignal) => {
      return new Promise<string>(resolve => {
        setTimeout(() => resolve("finished"), 50);
        signal.addEventListener("abort", () => {
          resolve("aborted unexpectedly");
        });
      });
    });

    const abortedPromise = requestManager.deduplicateRequest(
      "endpoint",
      { id: 1 },
      abortedFn
    );
    const completedPromise = requestManager.deduplicateRequest(
      "other-endpoint",
      { id: 2 },
      completedFn
    );

    const abortedExpectation = expect(abortedPromise).rejects.toMatchObject({
      name: "AbortError",
    });
    const completedExpectation = expect(completedPromise).resolves.toBe(
      "finished"
    );
    requestManager.abortRequests("endpoint");

    await abortedExpectation;
    await vi.runAllTimersAsync();
    await completedExpectation;
    expect(abortedFn).toHaveBeenCalledTimes(1);
    expect(completedFn).toHaveBeenCalledTimes(1);
    expect(requestManager.getPendingCount()).toBe(0);
  });
});
