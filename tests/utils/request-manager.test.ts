import { afterEach, describe, expect, it, vi } from "vitest";
import { requestManager } from "@/utils/request-manager";

const createDeferred = <T>() => {
  let resolve: (value: T | PromiseLike<T>) => void;
  let reject: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve: resolve!, reject: reject! };
};

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

  it("queues sequential requests and advances the active sequence counter", async () => {
    const firstDeferred = createDeferred<void>();
    const secondDeferred = createDeferred<void>();
    const events: string[] = [];

    const firstPromise = requestManager.sequentialRequest("queue", async () => {
      events.push("first-start");
      await firstDeferred.promise;
      events.push("first-finish");
      return "first-result";
    });

    const secondPromise = requestManager.sequentialRequest(
      "queue",
      async () => {
        events.push("second-start");
        await secondDeferred.promise;
        events.push("second-finish");
        return "second-result";
      }
    );

    await new Promise(resolve => setTimeout(resolve, 20));

    expect(events).toEqual(["first-start"]);
    expect(requestManager.getActiveSequence("queue")).toBe(1);

    firstDeferred.resolve();
    await firstPromise;

    expect(requestManager.getActiveSequence("queue")).toBe(2);

    await new Promise(resolve => setTimeout(resolve, 0));
    expect(events).toEqual(["first-start", "first-finish", "second-start"]);

    secondDeferred.resolve();
    await secondPromise;

    expect(events).toEqual([
      "first-start",
      "first-finish",
      "second-start",
      "second-finish",
    ]);
    expect(requestManager.getActiveSequence("queue")).toBe(3);
  });
});
