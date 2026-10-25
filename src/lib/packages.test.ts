import { describe, expect, it } from 'vitest';
import { formatPrice, getPackageById, JOB_PACKAGES, priceBreakdown } from '@/data/packages';
import { checkRateLimit } from '@/lib/rateLimit';

const store: Record<string, string> = {};

function mockStorage() {
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
}

describe('packages', () => {
  it('has three packages with expected durations', () => {
    expect(JOB_PACKAGES).toHaveLength(3);
    expect(getPackageById('standart')?.durationDays).toBe(7);
    expect(getPackageById('one-cikan')?.durationDays).toBe(14);
    expect(getPackageById('kurumsal')?.durationDays).toBe(30);
  });

  it('formats TRY price', () => {
    expect(formatPrice(499)).toContain('499');
    expect(formatPrice(598.8)).toContain('598,80');
  });

  it('adds 20% KDV on top of package prices (kuruş exact)', () => {
    expect(priceBreakdown(499)).toEqual({ net: 499, vat: 99.8, gross: 598.8, rate: 20 });
    expect(priceBreakdown(899).gross).toBe(1078.8);
    expect(priceBreakdown(2499).gross).toBe(2998.8);
  });

  it('does not promise unimplemented email digest features', () => {
    const all = JOB_PACKAGES.flatMap((p) => p.features).join(' ');
    expect(all.toLowerCase()).not.toContain('performans özeti');
    expect(all.toLowerCase()).not.toMatch(/e-posta bildirim/);
  });
});

describe('rateLimit', () => {
  it('allows first attempts then blocks', () => {
    mockStorage();
    const key = `test_${Date.now()}`;
    expect(checkRateLimit(key, 2, 60_000).ok).toBe(true);
    expect(checkRateLimit(key, 2, 60_000).ok).toBe(true);
    expect(checkRateLimit(key, 2, 60_000).ok).toBe(false);
  });
});
