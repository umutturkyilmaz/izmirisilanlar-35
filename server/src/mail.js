import nodemailer from 'nodemailer';

const siteUrl = () =>
  (process.env.PUBLIC_SITE_URL || 'https://izmirisilanlari35.com').replace(/\/$/, '');

export function isMailReady() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transporter = null;

function getTransporter() {
  if (!isMailReady()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendMail({ to, subject, text, html }) {
  const tx = getTransporter();
  if (!tx) {
    console.warn('[mail] SMTP yok — atlandı:', subject, '→', to);
    return { ok: false, skipped: true };
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await tx.sendMail({ from, to, subject, text, html: html || text });
  return { ok: true };
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
