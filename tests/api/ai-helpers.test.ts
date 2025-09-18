import { describe, it, expect } from "vitest";
import { buildUpstreamURL } from "../../src/app/api/ai/helpers";

describe("buildUpstreamURL", () => {
  it("trims trailing slashes and joins encoded path segments", () => {
    const result = buildUpstreamURL(
      "https://api.example.com/",
      ["models", "gpt 5", "responses"],
    );

    expect(result).toBe("https://api.example.com/models/gpt%205/responses");
  });

  it("appends query parameters while dropping slug keys", () => {
    const params = new URLSearchParams();
    params.append("foo", "bar");
    params.append("slug", "ignore-me");
    params.append("baz", "qux");

    const result = buildUpstreamURL("https://api.example.com", ["v1"], params);

    expect(result).toBe("https://api.example.com/v1?foo=bar&baz=qux");
  });

  it("handles empty segments and missing params", () => {
    const result = buildUpstreamURL("https://api.example.com///", ["", "models"]);
    expect(result).toBe("https://api.example.com/models");
  });
});
