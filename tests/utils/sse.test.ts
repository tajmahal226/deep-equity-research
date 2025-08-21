import { describe, it, expect } from "vitest";
import { createSSEStream } from "../../src/utils/sse";

const decoder = new TextDecoder();

describe("createSSEStream", () => {
  it("sends events to the stream consumer", async () => {
    const { stream, sendEvent } = createSSEStream();
    const reader = stream.getReader();

    // consume initial connected event
    await reader.read();

    sendEvent("test", { foo: "bar" });

    const { value } = await reader.read();
    const text = decoder.decode(value!);

    expect(text).toBe('event: test\ndata: {"foo":"bar"}\n\n');
  });

  it("closes the stream and sends a close event", async () => {
    const { stream, sendEvent, closeStream } = createSSEStream();
    const reader = stream.getReader();

    // consume initial connected event
    await reader.read();

    // send a regular event
    sendEvent("ping", { ok: true });
    await reader.read();

    // close the stream
    closeStream();

    const { value } = await reader.read();
    const text = decoder.decode(value!);
    const [eventLine, dataLine] = text.trimEnd().split("\n");
    expect(eventLine).toBe("event: close");

    const data = JSON.parse(dataLine.replace("data: ", ""));
    expect(data.message).toBe("Stream closed by server");

    const final = await reader.read();
    expect(final.done).toBe(true);

    // further events should not be delivered
    sendEvent("after", { test: true });
    const after = await reader.read();
    expect(after.done).toBe(true);
  });
});
