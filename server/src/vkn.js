/**
 * Türkiye Vergi Kimlik No (VKN) — 10 hane + kontrol basamağı.
 * Gerçek mükellef sorgusu değildir; yalnızca algoritmik doğruluk.
 */

export function normalizeVkn(input) {
  return String(input ?? '').replace(/[\s\-]/g, '').replace(/[^0-9]/g, '');
}

export function isValidVkn(input) {
  const vkn = normalizeVkn(input);
  if (!/^[0-9]{10}$/.test(vkn)) return false;
  if (/^([0-9])\1{9}$/.test(vkn)) return false;

  const v = [...vkn].map(Number);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const tmp = (v[i] + (9 - i)) % 10;
    if (tmp === 0) continue;
    let product = (tmp * Math.pow(2, 9 - i)) % 9;
    if (product === 0) product = 9;
    sum += product;
  }
  const check = (10 - (sum % 10)) % 10;
  return v[9] === check;
}
