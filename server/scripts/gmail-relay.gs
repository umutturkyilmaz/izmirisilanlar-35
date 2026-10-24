/**
 * İzmir İş İlanları 35 — Gmail e-posta köprüsü (Google Apps Script)
 *
 * Railway Hobby planında SMTP kapalı olduğu için API, e-postaları HTTPS ile bu
 * betiğe gönderir; betik de sizin Gmail hesabınızdan iletir. Ücretsizdir
 * (kişisel Gmail: günde ~100 alıcı).
 *
 * Kurulum:
 * 1. https://script.google.com → Yeni proje → bu dosyanın içeriğini yapıştırın.
 * 2. SECRET değerini uzun, rastgele bir metinle değiştirin.
 * 3. Dağıt → Yeni dağıtım → Tür: Web uygulaması
 *      Şu kullanıcı olarak çalıştır: Ben
 *      Erişimi olan kişiler: Herkes
 *    → Dağıt → Gmail izinlerini onaylayın → Web uygulaması URL'sini kopyalayın.
 * 4. Railway → API servisi → Variables:
 *      GAS_MAIL_URL    = kopyaladığınız URL
 *      GAS_MAIL_SECRET = 2. adımdaki SECRET
 */
const SECRET = 'BURAYA-UZUN-RASTGELE-BIR-SIFRE-YAZIN';
const SENDER_NAME = 'İzmir İş İlanları 35';

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (!body || body.secret !== SECRET) return json({ ok: false, error: 'Yetkisiz' });
    if (!body.to || !body.subject) return json({ ok: false, error: 'to/subject gerekli' });

    const options = { name: SENDER_NAME };
    if (body.html) options.htmlBody = body.html;
    if (body.replyTo) options.replyTo = body.replyTo;
    if (Array.isArray(body.attachments) && body.attachments.length) {
      options.attachments = body.attachments.map(function (a) {
        return Utilities.newBlob(Utilities.base64Decode(a.content), a.contentType || 'application/octet-stream', a.filename);
      });
    }
    GmailApp.sendEmail(body.to, body.subject, body.text || '', options);
    return json({ ok: true, remaining: MailApp.getRemainingDailyQuota() });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
