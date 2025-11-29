import { describe, expect, it } from "vitest";
import { parseTemperature } from "../../src/utils/command-parameters";

describe("parseTemperature", () => {
  it("parses temperature provided with explicit keyword", () => {
    expect(parseTemperature("run research temperature=0.65"))
      .toBeCloseTo(0.65);
    expect(parseTemperature("temperature: 1"))
      .toBeCloseTo(1);
  });

  it("supports common flag aliases", () => {
    expect(parseTemperature("--temperature 0.4"))
      .toBeCloseTo(0.4);
    expect(parseTemperature("--temp=0.9"))
      .toBeCloseTo(0.9);
    expect(parseTemperature("-t 0.25"))
      .toBeCloseTo(0.25);
  });

  it("clamps out-of-range values to provider-safe bounds", () => {
    expect(parseTemperature("--temperature 2.5")).toBe(2);
    expect(parseTemperature("temperature -1")).toBe(0);
  });

  it("returns undefined when no temperature is supplied", () => {
    expect(parseTemperature("run research apple"))
      .toBeUndefined();
  });

  it("ignores unparsable temperature values", () => {
    expect(parseTemperature("temperature=high"))
      .toBeUndefined();
  });
});
