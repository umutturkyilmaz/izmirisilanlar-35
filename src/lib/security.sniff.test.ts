import { describe, expect, it } from 'vitest';
import { sniffFileMime } from '../../server/src/security.js';

describe('sniffFileMime', () => {
  it('detects jpeg', () => {
    expect(sniffFileMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
  });
  it('detects png', () => {
    expect(sniffFileMime(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(
      'image/png',
    );
  });
  it('detects pdf', () => {
    expect(sniffFileMime(new TextEncoder().encode('%PDF-1.4'))).toBe('application/pdf');
  });
  it('rejects unknown', () => {
    expect(sniffFileMime(new TextEncoder().encode('hello'))).toBeNull();
  });
});
