import { afterEach, describe, expect, it, vi } from "vitest";
import { requestManager } from "@/utils/request-manager";

describe("RequestManager", () => {
  afterEach(() => {
    requestManager.reset();
  });

  it("passes the abort signal to deduplicated requests", async () => {
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
});
