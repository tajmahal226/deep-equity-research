/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { Button } from "@/components/Internal/Button";

describe("Button Component", () => {
  it("should use title as fallback for aria-label when aria-label is not provided", () => {
    const { container } = render(
      <Button title="Save Document">
        <span>💾</span>
      </Button>
    );

    const button = container.querySelector("button");
    expect(button).toBeTruthy();
    expect(button?.getAttribute("aria-label")).toBe("Save Document");
  });

  it("should preserve explicit aria-label when provided", () => {
    const { container } = render(
      <Button title="Save Document" aria-label="Custom Save Label">
        <span>💾</span>
      </Button>
    );

    const button = container.querySelector("button");
    expect(button).toBeTruthy();
    expect(button?.getAttribute("aria-label")).toBe("Custom Save Label");
  });

  it("should not set aria-label when title is not provided", () => {
    const { container } = render(
      <Button>
        <span>Click me</span>
      </Button>
    );

    const button = container.querySelector("button");
    expect(button).toBeTruthy();
    expect(button?.getAttribute("aria-label")).toBeNull();
  });
});
