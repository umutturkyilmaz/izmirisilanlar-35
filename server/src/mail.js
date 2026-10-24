import dns from 'node:dns/promises';
import nodemailer from 'nodemailer';

const siteUrl = () =>
  (process.env.PUBLIC_SITE_URL || 'https://izmirisilanlari35.com').replace(/\/$/, '');

/**
 * Railway Hobby planında giden SMTP kapalı → HTTPS tabanlı sağlayıcılar:
 *  - resend: RESEND_API_KEY + MAIL_FROM (doğrulanmış alan adı)
 *  - gas:    GAS_MAIL_URL + GAS_MAIL_SECRET (Google Apps Script köprüsü, Gmail'den gönderir)
 *  - smtp:   SMTP_HOST/USER/PASS (yalnızca Railway Pro)
 */
function mailProvider() {
  const forced = String(process.env.MAIL_PROVIDER || '').trim().toLowerCase();
  if (forced) return forced;
  if (process.env.RESEND_API_KEY) return 'resend';
  if (process.env.GAS_MAIL_URL) return 'gas';
  return 'smtp';
}

export function isMailReady() {
  const p = mailProvider();
  if (p === 'resend') return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
  if (p === 'gas') return Boolean(process.env.GAS_MAIL_URL && process.env.GAS_MAIL_SECRET);
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function toBase64(content) {
  return Buffer.isBuffer(content) ? content.toString('base64') : Buffer.from(String(content)).toString('base64');
}

async function sendViaResend({ to, subject, text, html, attachments }) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM,
      to: [to],
      reply_to: process.env.MAIL_REPLY_TO || undefined,
      subject,
      text,
      html: html || undefined,
      attachments: attachments?.map((a) => ({ filename: a.filename, content: toBase64(a.content) })),
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(`Resend ${r.status}: ${data.message || data.error || 'gönderim başarısız'}`);
  }
}

async function sendViaAppsScript({ to, subject, text, html, attachments }) {
  const r = await fetch(process.env.GAS_MAIL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: process.env.GAS_MAIL_SECRET,
      to,
      subject,
      text,
      html: html || '',
      replyTo: process.env.MAIL_REPLY_TO || '',
      attachments: attachments?.map((a) => ({
        filename: a.filename,
        contentType: a.contentType || 'application/octet-stream',
        content: toBase64(a.content),
      })),
    }),
    redirect: 'follow',
    signal: AbortSignal.timeout(90000),
  });
  const data = await r.json().catch(() => null);
  if (!r.ok || !data?.ok) {
    throw new Error(`Apps Script: ${data?.error || `HTTP ${r.status} (dağıtım URL'si/yetki kontrol edin)`}`);
  }
}

let transporter = null;

/** Railway konteynerlerinde IPv6 çıkışı yok (ENETUNREACH); SMTP sunucusuna IPv4 ile bağlan */
async function getTransporter() {
  if (!isMailReady()) return null;
  if (!transporter) {
    const host = process.env.SMTP_HOST;
    let connectHost = host;
    try {
      const [ipv4] = await dns.resolve4(host);
      if (ipv4) connectHost = ipv4;
    } catch {
      /* IP yerine host adıyla dene */
    }
    transporter = nodemailer.createTransport({
      host: connectHost,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: { servername: host },
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 60000,
    });
  }
  return transporter;
}

export async function sendMail({ to, subject, text, html, attachments }) {
  if (!isMailReady()) {
    console.warn('[mail] e-posta yapılandırılmamış — atlandı:', subject, '→', to);
    return { ok: false, skipped: true };
  }
  const provider = mailProvider();
  if (provider === 'resend' || provider === 'gas') {
    try {
      await (provider === 'resend' ? sendViaResend : sendViaAppsScript)({
        to,
        subject,
        text,
        html,
        attachments,
      });
    } catch (e) {
      console.error('[mail] gönderilemedi:', subject, '→', to, e.message);
      throw e;
    }
    return { ok: true };
  }
  const tx = await getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  try {
    await tx.sendMail({ from, to, subject, text, html: html || text, attachments });
  } catch (e) {
    // IP değişmiş olabilir; sonraki gönderimde yeniden çöz
    transporter = null;
    console.error('[mail] gönderilemedi:', subject, '→', to, e.message);
    throw e;
  }
  return { ok: true };
}

/** Admin teşhisi: SMTP bağlantısı + kimlik doğrulama (HTTPS sağlayıcılarda test e-postası yeterli) */
export async function verifySmtp() {
  if (!isMailReady()) throw new Error('E-posta yapılandırılmamış (RESEND_API_KEY / GAS_MAIL_URL / SMTP)');
  if (mailProvider() !== 'smtp') return true;
  const tx = await getTransporter();
  if (!tx) throw new Error('SMTP yapılandırılmamış');
  try {
    await tx.verify();
  } catch (e) {
    transporter = null;
    throw e;
  }
  return true;
}

export async function sendBackupEmail({ filename, buffer, counts, includeBlobs }) {
  const summary = Object.entries(counts)
    .map(([t, n]) => `${t}: ${n}`)
    .join('\n');
  return sendMail({
    to: process.env.BACKUP_EMAIL_TO || adminNotifyTo(),
    subject: `Veritabanı yedeği — ${new Date().toLocaleDateString('tr-TR')}`,
    text: `İzmir İş İlanları 35 günlük veritabanı yedeği ektedir (${(buffer.length / 1024 / 1024).toFixed(1)} MB).\n${
      includeBlobs
        ? 'Yüklenen dosyalar (CV, görseller) dahildir.'
        : 'Boyut sınırı nedeniyle yüklenen dosyaların içeriği hariçtir; tam yedek için Admin → Yedek İndir.'
    }\n\nKayıt sayıları:\n${summary}\n\nGeri yükleme: server/scripts/restore-backup.mjs`,
    attachments: [{ filename, content: buffer, contentType: 'application/gzip' }],
  });
}

export async function sendPasswordResetEmail(email, token) {
  const link = `${siteUrl()}/sifre-sifirla?token=${encodeURIComponent(token)}`;
  return sendMail({
    to: email,
    subject: 'Şifre sıfırlama — İzmir İş İlanları 35',
    text: `Şifrenizi sıfırlamak için linke tıklayın (1 saat geçerli):\n\n${link}\n\nBu isteği siz yapmadıysanız yok sayın.`,
    html: `<p>Şifrenizi sıfırlamak için aşağıdaki bağlantıyı kullanın (1 saat geçerli):</p><p><a href="${link}">${link}</a></p><p>Bu isteği siz yapmadıysanız yok sayın.</p>`,
  });
}

export async function sendContactAckEmail(email, name) {
  return sendMail({
    to: email,
    subject: 'Mesajınız alındı — İzmir İş İlanları 35',
    text: `Merhaba ${name},\n\nİletişim formundaki mesajınızı aldık. En kısa sürede dönüş yapacağız.\n\n— İzmir İş İlanları 35`,
  });
}

export async function sendContactNotifyEmail({ name, email, subject, message }) {
  const to =
    process.env.CONTACT_NOTIFY_TO ||
    process.env.SMTP_FROM?.match(/<([^>]+)>/)?.[1] ||
    process.env.SMTP_USER ||
    'umutata355@gmail.com';
  return sendMail({
    to,
    subject: `İletişim formu: ${subject || '(konusuz)'} — ${name}`,
    text: `Yeni iletişim mesajı\n\nAd: ${name}\nE-posta: ${email}\nKonu: ${subject || '—'}\n\n${message}`,
    html: `<p><b>Yeni iletişim mesajı</b></p>
<p>Ad: ${name}<br/>E-posta: <a href="mailto:${email}">${email}</a><br/>Konu: ${subject || '—'}</p>
<pre style="white-space:pre-wrap;font-family:inherit">${String(message || '').replace(/</g, '&lt;')}</pre>`,
  });
}

export async function sendNewApplicationEmail(employerEmail, jobTitle) {
  if (!employerEmail) return { ok: false, skipped: true };
  return sendMail({
    to: employerEmail,
    subject: `Yeni başvuru: ${jobTitle}`,
    text: `"${jobTitle}" ilanınıza yeni bir başvuru geldi. Başvuruları profilinizden inceleyebilirsiniz:\n${siteUrl()}/profil/isveren`,
  });
}

export async function sendEmployerVerifiedEmail(email, companyName) {
  if (!email) return { ok: false, skipped: true };
  return sendMail({
    to: email,
    subject: 'İşveren hesabınız onaylandı',
    text: `Merhaba,\n\n${companyName || 'İşveren'} hesabınız doğrulandı. Artık ilan yayınlayabilirsiniz.\n${siteUrl()}/ilan-ekle\n\n— İzmir İş İlanları 35`,
  });
}

const APP_STATUS_TR = {
  pending: 'Değerlendiriliyor',
  reviewed: 'İncelendi',
  accepted: 'Kabul edildi',
  rejected: 'Reddedildi',
};

export async function sendApplicationStatusEmail(email, jobTitle, status) {
  if (!email) return { ok: false, skipped: true };
  const label = APP_STATUS_TR[status] || status;
  return sendMail({
    to: email,
    subject: `Başvuru durumu: ${jobTitle}`,
    text: `"${jobTitle}" ilanına yaptığınız başvurunun durumu güncellendi: ${label}.\n${siteUrl()}/basvurularim\n\n— İzmir İş İlanları 35`,
  });
}

function adminNotifyTo() {
  return (
    process.env.PAYMENT_NOTIFY_TO ||
    process.env.CONTACT_NOTIFY_TO ||
    process.env.SMTP_FROM?.match(/<([^>]+)>/)?.[1] ||
    process.env.SMTP_USER ||
    'umutata355@gmail.com'
  );
}

export async function sendPaymentReceiptEmail(email, { packageName, amount, orderRef }) {
  if (!email) return { ok: false, skipped: true };
  return sendMail({
    to: email,
    subject: `Ödemeniz alındı — ${packageName}`,
    text: `Merhaba,\n\n${packageName} paketi için ${amount} TL ödemeniz alındı ve ilan hakkınız tanımlandı.\nSipariş referansı: ${orderRef}\n\nİlan yayınlamak için: ${siteUrl()}/ilan-ekle\n\n— İzmir İş İlanları 35`,
  });
}

export async function sendPaymentAdminNotifyEmail({ packageName, amount, buyer, orderRef }) {
  return sendMail({
    to: adminNotifyTo(),
    subject: `Yeni ödeme: ${packageName} — ${amount} TL`,
    text: `iyzico ile yeni ödeme alındı.\n\nPaket: ${packageName}\nTutar: ${amount} TL\nAlıcı: ${buyer || '—'}\nReferans: ${orderRef}\n\nAdmin paneli: ${siteUrl()}/admin`,
  });
}

export async function sendEmailVerification(email, token) {
  const link = `${siteUrl()}/email-dogrula?token=${encodeURIComponent(token)}`;
  return sendMail({
    to: email,
    subject: 'E-posta doğrulama — İzmir İş İlanları 35',
    text: `Hesabınızı doğrulamak için linke tıklayın (24 saat geçerli):\n\n${link}\n\nBu isteği siz yapmadıysanız yok sayın.`,
    html: `<p>Hesabınızı doğrulamak için aşağıdaki bağlantıyı kullanın (24 saat geçerli):</p><p><a href="${link}">${link}</a></p>`,
  });
}
