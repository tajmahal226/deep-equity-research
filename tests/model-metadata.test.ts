import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getActiveModels, isModelStale } from '@/utils/model-metadata';

describe('model-metadata', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-16T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps Gemini 3 variants active for Google', () => {
    const activeModels = getActiveModels('google');

    expect(activeModels.has('gemini-3-pro')).toBe(true);
    expect(activeModels.has('gemini-3-flash-thinking')).toBe(true);
  });

  it('does not mark Gemini 3 releases as stale within a year', () => {
    expect(isModelStale('google', 'gemini-3-pro')).toBe(false);
    expect(isModelStale('google', 'gemini-3-flash-thinking')).toBe(false);
  });
});
