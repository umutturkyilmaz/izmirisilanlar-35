import dns from 'node:dns/promises';
import { isValidVkn, normalizeVkn } from './vkn.js';

/**
 * İşveren ön kontrolü — resmi mükellef sorgusu DEĞİLDİR.
 * Sahte/atılabilir hesapları eler; düşük riskliler otomatik onaylanabilir.
 */

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.com.tr', 'outlook.com', 'outlook.com.tr',
  'live.com', 'msn.com', 'windowslive.com', 'yahoo.com', 'yahoo.com.tr', 'yandex.com', 'yandex.com.tr',
  'yandex.ru', 'icloud.com', 'me.com', 'mac.com', 'mail.com', 'gmx.com', 'gmx.de', 'aol.com',
  'protonmail.com', 'proton.me', 'mynet.com', 'mail.ru', 'zoho.com', 'tutanota.com',
]);

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com', '10minutemail.com', 'guerrillamail.com', 'guerrillamail.net', 'tempmail.com',
  'temp-mail.org', 'yopmail.com', 'trashmail.com', 'getnada.com', 'sharklasers.com', 'dispostable.com',
  'maildrop.cc', 'throwawaymail.com', 'moakt.com', 'emailondeck.com', 'fakeinbox.com', 'mintemail.com',
  'tempail.com', 'mohmal.com', 'burnermail.io', '1secmail.com', 'tempmailo.com', 'mail.tm', 'minuteinbox.com',
]);

function emailDomain(email) {
  return String(email || '').trim().toLowerCase().split('@')[1] || '';
}

async function hasMx(domain) {
  if (!domain) return false;
  try {
    const records = await Promise.race([
      dns.resolveMx(domain),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000)),
    ]);
    return Array.isArray(records) && records.length > 0;
  } catch {
    return false;
  }
}

export function isValidTrPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '').replace(/^(90|0)/, '');
  return /^[2-5]\d{9}$/.test(digits);
}

/**
 * @param {object} user users satırı
 * @param {number} duplicateVknCount aynı VKN ile kayıtlı DİĞER hesap sayısı
 * @returns {Promise<{ level: 'low'|'medium'|'high', checks: Array<{ key: string, label: string, ok: boolean }> }>}
 */
export async function assessEmployer(user, duplicateVknCount) {
  const vkn = normalizeVkn(user.vergi_numarasi);
  const domain = emailDomain(user.email);
  const disposable = DISPOSABLE_EMAIL_DOMAINS.has(domain);
  // Doğrulama e-postası ulaştıysa alan adı posta alıyor demektir; MX yalnızca doğrulanmamışsa sorgulanır
  const mx = user.email_verified ? true : await hasMx(domain);
  const company = String(user.company_name || '').trim();

  const checks = [
    { key: 'vkn_valid', label: 'Vergi no geçerli (algoritma)', ok: isValidVkn(vkn) },
    { key: 'vkn_unique', label: 'Vergi no başka hesapta yok', ok: duplicateVknCount === 0 },
    { key: 'email_verified', label: 'E-posta doğrulandı', ok: Boolean(user.email_verified) },
    { key: 'not_disposable', label: 'Geçici e-posta değil', ok: !disposable },
    { key: 'email_mx', label: 'E-posta alan adı posta alıyor', ok: mx },
    { key: 'corporate_email', label: 'Kurumsal e-posta (gmail vb. değil)', ok: Boolean(domain) && !FREE_EMAIL_DOMAINS.has(domain) },
    { key: 'phone_valid', label: 'Telefon geçerli', ok: isValidTrPhone(user.phone) },
    { key: 'company_name', label: 'Şirket adı dolu', ok: company.length >= 3 && /\p{L}/u.test(company) },
  ];
  const ok = Object.fromEntries(checks.map((c) => [c.key, c.ok]));

  let level = 'medium';
  if (!ok.vkn_valid || !ok.vkn_unique || !ok.not_disposable) {
    level = 'high';
  } else if (checks.every((c) => c.ok)) {
    level = 'low';
  }
  return { level, checks };
}
