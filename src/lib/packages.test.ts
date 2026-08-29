import { describe, expect, it, beforeEach } from 'vitest';
import { formatPrice, getPackageById, JOB_PACKAGES } from '@/data/packages';
import { checkRateLimit } from '@/lib/rateLimit';
import { isIyzicoConfigured } from '@/lib/iyzico';

const store: Record<string, string> = {};

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  globalThis.localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    key: () => null,
    length: 0,
  } as Storage;
});

describe('packages', () => {
  it('has three packages with expected durations', () => {
    expect(JOB_PACKAGES).toHaveLength(3);
    expect(getPackageById('standart')?.durationDays).toBe(7);
    expect(getPackageById('one-cikan')?.durationDays).toBe(14);
    expect(getPackageById('kurumsal')?.durationDays).toBe(30);
  });

  it('formats TRY price', () => {
    const text = formatPrice(499);
    expect(text).toContain('499');
  });
});

describe('rateLimit', () => {
  it('allows first attempts then blocks', () => {
    const key = `test_${Date.now()}`;
    expect(checkRateLimit(key, 2, 60_000).ok).toBe(true);
    expect(checkRateLimit(key, 2, 60_000).ok).toBe(true);
    expect(checkRateLimit(key, 2, 60_000).ok).toBe(false);
  });
});

describe('iyzico stub', () => {
  it('reports not configured without env flags', () => {
    expect(isIyzicoConfigured()).toBe(false);
  });
});
