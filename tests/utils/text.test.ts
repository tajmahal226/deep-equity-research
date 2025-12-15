import { describe, it, expect } from "vitest";
import {
  splitText,
  removeJsonMarkdown,
  containsXmlHtmlTags,
} from "../../src/utils/text";

describe("text utilities", () => {
  it("splits text into chunks respecting max length", () => {
    const text = "para1\npara2";
    const chunks = splitText(text, 10);
    expect(chunks).toEqual(["para1", "para2"]);
  });

  it("splits oversized paragraphs to respect the limit", () => {
    const longParagraph = "abcdefghij".repeat(3); // length 30
    const chunks = splitText(longParagraph, 12);

    expect(chunks).toEqual(["abcdefghijab", "cdefghijabcd", "efghij"]);
    expect(chunks.every(chunk => chunk.length <= 12)).toBe(true);
  });

  it("removes json markdown fences", () => {
    const input = "```json\n{\"a\":1}\n```";
    expect(removeJsonMarkdown(input)).toBe('{"a":1}');
  });

  it("detects xml or html tags", () => {
    expect(containsXmlHtmlTags("<p>hi</p>")).toBe(true);
    expect(containsXmlHtmlTags("plain text")).toBe(false);
  });
});
