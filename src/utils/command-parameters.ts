const TEMPERATURE_PATTERNS = [
  /(?:^|\s)(?:--temperature|--temp)\s*[:=]?\s*(-?\d+(?:\.\d+)?)/i,
  /(?:^|\s)-t\s*[:=]?\s*(-?\d+(?:\.\d+)?)/i,
  /(?:^|\s)temperature\s*[:=]?\s*(-?\d+(?:\.\d+)?)/i,
  /(?:^|\s)temp\s*[:=]?\s*(-?\d+(?:\.\d+)?)/i,
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
 *
 * The returned value is clamped to the safe range [0, 2] commonly
 * supported by providers.
 *
 * @param command - The input command string.
 * @returns The parsed temperature value or undefined if not found.
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
