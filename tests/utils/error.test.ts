import { describe, it, expect } from "vitest";
import { parseError } from "../../src/utils/error";

describe("parseError", () => {
  it("returns string errors directly", () => {
    expect(parseError("my error")).toBe("my error");
  });

  it("parses API errors with response body", () => {
    const err = {
      error: {
        name: "APIError",
        message: "ignored",
        responseBody: JSON.stringify({
          error: {
            code: 400,
            message: "Invalid",
            status: "INVALID_ARGUMENT",
          },
        }),
      },
    };
    expect(parseError(err)).toBe("[INVALID_ARGUMENT]: Invalid");
  });

  it("parses API errors without response body", () => {
    const err = {
      error: {
        name: "APIError",
        message: "Something went wrong",
      },
    };
    expect(parseError(err)).toBe("[APIError]: Something went wrong");
  });

  it("returns default message for unsupported input", () => {
    expect(parseError(42)).toBe("Unknown Error");
  });
});
