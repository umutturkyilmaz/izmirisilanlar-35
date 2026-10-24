/**
 * İzmir İş İlanları 35 — Gmail'deki eski veritabanı yedeklerini otomatik temizler.
 *
 * Sadece sistemin gönderdiği, ek dosyalı "Veritabanı yedeği" e-postalarını
 * KEEP_DAYS günden eskiyse çöp kutusuna taşır (Gmail 30 gün sonra kalıcı siler).
 * Diğer e-postalarınıza dokunmaz.
 *
 * Kurulum (bir kez):
 * 1. https://script.google.com → Yeni proje → bu dosyanın içeriğini yapıştırın → Kaydet.
 * 2. Üstteki fonksiyon listesinden "kurulum" seçin → Çalıştır → Gmail iznini onaylayın.
 *    Bu, temizliği her gece 03:00 civarında çalışacak şekilde zamanlar.
 * 3. İsterseniz "temizle" fonksiyonunu bir kez elle çalıştırıp Günlükler'den sonucu görün.
 */
const KEEP_DAYS = 60;
const SENDER = 'bildirim@izmirisilanlari35.com';
const SUBJECT = 'Veritabanı yedeği';

function temizle() {
  const query = `from:${SENDER} subject:"${SUBJECT}" has:attachment older_than:${KEEP_DAYS}d`;
  let total = 0;
  // GmailApp.search en fazla 500 sonuç döndürür; tümü bitene kadar parça parça işle
  while (true) {
    const threads = GmailApp.search(query, 0, 100);
    if (!threads.length) break;
    GmailApp.moveThreadsToTrash(threads);
    total += threads.length;
    if (threads.length < 100) break;
  }
  console.log(`${total} eski yedek e-postası çöpe taşındı (>${KEEP_DAYS} gün).`);
  return total;
}

function kurulum() {
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'temizle')
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('temizle').timeBased().everyDays(1).atHour(3).create();
  console.log('Günlük temizlik zamanlandı (her gün ~03:00).');
}
