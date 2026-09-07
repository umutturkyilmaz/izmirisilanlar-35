import { describe, expect, it } from 'vitest';
import { isValidVkn, normalizeVkn } from './vkn';

describe('VKN checksum', () => {
  it('normalizes spaces and dashes', () => {
    expect(normalizeVkn('100 000 001 8')).toBe('1000000018');
    expect(normalizeVkn('1000-0000-18')).toBe('1000000018');
  });

  it('accepts known valid VKN', () => {
    expect(isValidVkn('1000000018')).toBe(true);
  });

  it('rejects wrong length', () => {
    expect(isValidVkn('123456789')).toBe(false);
    expect(isValidVkn('12345678901')).toBe(false);
  });

  it('rejects bad checksum', () => {
    expect(isValidVkn('1000000019')).toBe(false);
  });

  it('rejects repeated digits', () => {
    expect(isValidVkn('1111111111')).toBe(false);
  });
});
