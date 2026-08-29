/** Basit istemci tarafı hız limiti (spam azaltma). */
export function checkRateLimit(key: string, maxAttempts: number, windowMs: number): {
  ok: boolean;
  retryAfterSec?: number;
} {
  try {
    const storageKey = `rl_${key}`;
    const now = Date.now();
    const raw = localStorage.getItem(storageKey);
    let stamps: number[] = raw ? (JSON.parse(raw) as number[]) : [];
    stamps = stamps.filter((t) => now - t < windowMs);
    if (stamps.length >= maxAttempts) {
      const oldest = stamps[0];
      return { ok: false, retryAfterSec: Math.ceil((windowMs - (now - oldest)) / 1000) };
    }
    stamps.push(now);
    localStorage.setItem(storageKey, JSON.stringify(stamps));
    return { ok: true };
  } catch {
    return { ok: true };
  }
}
