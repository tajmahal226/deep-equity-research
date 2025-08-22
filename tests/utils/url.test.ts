import { describe, it, expect, vi } from "vitest";
import { completePath } from "../../src/utils/url";

describe("completePath", () => {
  it("appends new path when version missing", () => {
    expect(completePath("https://api.test.com", "/v1")).toBe(
      "https://api.test.com/v1",
    );
  });

  it("does not append when version exists", () => {
    expect(completePath("https://api.test.com/v1/", "/v1")).toBe(
      "https://api.test.com/v1",
    );
  });

  it("returns original string for invalid url", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(completePath("not a url", "/v1")).toBe("not a url");
    spy.mockRestore();
  });
});
