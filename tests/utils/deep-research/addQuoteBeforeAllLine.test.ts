import { describe, it, expect } from "vitest";
import { addQuoteBeforeAllLine } from "@/utils/deep-research";

describe("addQuoteBeforeAllLine", () => {
  it("should return an empty string when given an empty string", () => {
    expect(addQuoteBeforeAllLine("")).toBe("");
  });

  it("should add a quote to a single line", () => {
    expect(addQuoteBeforeAllLine("hello")).toBe("> hello");
  });

  it("should add a quote to multiple lines", () => {
    expect(addQuoteBeforeAllLine("hello\nworld")).toBe("> hello\n> world");
  });
});
