const NUMBER_PATTERN = "([+-]?(?:\\d*\\.\\d+|\\d+(?:\\.\\d*)?))";
const TRAILING_BOUNDARY = "(?=$|\\s|[,:;!?]|\\.(?!\\d))";

const TEMPERATURE_PATTERNS = [
  new RegExp(
    `(?:^|\\s)(?:--temperature|--temp)\\s*[:=]?\\s*${NUMBER_PATTERN}${TRAILING_BOUNDARY}`,
    "i",
  ),
  new RegExp(`(?:^|\\s)-t\\s*[:=]?\\s*${NUMBER_PATTERN}${TRAILING_BOUNDARY}`, "i"),
  new RegExp(`(?:^|\\s)temperature\\s*[:=]?\\s*${NUMBER_PATTERN}${TRAILING_BOUNDARY}`, "i"),
  new RegExp(`(?:^|\\s)temp\\s*[:=]?\\s*${NUMBER_PATTERN}${TRAILING_BOUNDARY}`, "i"),
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Extracts a temperature value from a free-form command string.
 *
 * Supported formats (case-insensitive):
 * - "temperature=0.7"
 * - "--temperature 0.8"
 * - "--temp=0.5"
 * - "-t 0.9"
 * - "-t.65" (no leading zero) or values with trailing punctuation like "--temp=0.8,".
 *
 * The returned value is clamped to the safe range [0, 2] commonly
 * supported by providers. If no valid temperature is found, returns undefined.
 * Trailing letters (e.g., unit suffixes) are intentionally ignored to avoid
 * partial numeric matches.
 */
export function parseTemperature(command: string): number | undefined {
  if (!command) {
    return undefined;
  }

  for (const pattern of TEMPERATURE_PATTERNS) {
    const match = command.match(pattern);
    if (!match) {
      continue;
    }

    const value = Number.parseFloat(match[1]);
    if (Number.isFinite(value)) {
      return clamp(value, 0, 2);
    }
  }

  return undefined;
}
