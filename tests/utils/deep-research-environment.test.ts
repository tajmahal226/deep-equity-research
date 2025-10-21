import { describe, expect, it, vi } from 'vitest';

function restoreGlobal(key: 'global' | 'location', value: unknown, existed: boolean) {
  if (!existed) {
    delete (globalThis as Record<string, unknown>)[key];
    return;
  }
  (globalThis as Record<string, unknown>)[key] = value;
}

describe('deep research helpers environment guards', () => {
  it('does not throw when global and location are undefined during import', async () => {
    const originalGlobal = (globalThis as Record<string, unknown>).global;
    const originalLocation = (globalThis as Record<string, unknown>).location;
    const hadGlobal = 'global' in globalThis;
    const hadLocation = 'location' in globalThis;

    try {
      (globalThis as Record<string, unknown>).global = undefined;
      delete (globalThis as Record<string, unknown>).location;
      vi.resetModules();

      await expect(import('@/utils/deep-research/provider')).resolves.toBeTruthy();
      await expect(import('@/utils/deep-research/search')).resolves.toBeTruthy();
    } finally {
      vi.resetModules();
      restoreGlobal('global', originalGlobal, hadGlobal);
      restoreGlobal('location', originalLocation, hadLocation);
    }
  });
});
