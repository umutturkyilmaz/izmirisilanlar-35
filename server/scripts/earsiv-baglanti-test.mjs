/**
 * e-Arşiv fatura bağlantı testi — KAM otonom gelir turu aracı.
 *
 * Ne yapar:
 *   1) GİB e-Arşiv Portalı'na giriş dener (TEST ya da PROD modu).
 *   2) Kullanıcı bilgilerini çeker.
 *   3) Tek kalemli TASLAK fatura oluşturur (henüz imzasız, mali değeri yoktur).
 *   4) Taslak listesinden oluşturulan belgeyi doğrular.
 *   5) Oturumu kapatır.
 *
 * Kullanım (PowerShell, server/ klasöründen):
 *   $env:EARSIV_ENABLED='true'; $env:EARSIV_MODE='TEST'
 *   $env:EARSIV_USER='<kullanici kodu>'; $env:EARSIV_PASS='<sifre>'
 *   node scripts/earsiv-baglanti-test.mjs
 *
 * Not: Şifre komut satırına yazılmaz; ortam değişkeninden okunur ve kayda yazılmaz.
 *     İmza (SMS) adımı bilinçli olarak çalıştırılmaz — resmi faturayı o adım dönüştürür.
 */

import crypto from 'node:crypto';
import * as earsiv from '../src/earsiv.js';

const STEP = (n, msg) => console.log(`[${n}] ${msg}`);

async function main() {
  if (!earsiv.isEarsivReady()) {
    console.error(
      'e-Arşiv yapılandırılmamış. EARSIV_ENABLED=true, EARSIV_USER ve EARSIV_PASS tanımlı olmalı.',
    );
    process.exit(2);
  }

  STEP(1, `Giriş deneniyor (mod: ${earsiv.earsivMode()})`);
  const token = await earsiv.login();
  STEP(1, `Giriş başarılı (oturum açıldı)`);

  try {
    STEP(2, 'Kullanıcı bilgileri çekiliyor');
    const user = await earsiv.getUserData(token);
    const unvan = user?.unvan || user?.baslik || JSON.stringify(user).slice(0, 120);
    STEP(2, `Kullanıcı: ${unvan}`);

    STEP(3, 'Taslak fatura oluşturuluyor');
    const { date, time } = earsiv.trNow();
    const inv = {
      uuid: crypto.randomUUID(),
      date,
      time,
      buyer: {
        taxId: '11111111111',
        title: 'KAM Bağlantı Testi',
        name: 'Test',
        surname: 'Müşteri',
        taxOffice: 'Test',
        address: 'Test adresi',
        city: 'İzmir',
        email: 'test@example.com',
        phone: '05550000000',
      },
      itemName: 'KAM bağlantı testi — ilan paketi',
      net: 500,
      vat: 100,
      vatRate: 20,
      gross: 600,
      note: 'KAM otonom gelir turu bağlantı testi (imzasız taslak)',
      orderNumber: `KAM-TEST-${Date.now()}`,
    };
    const uuid = await earsiv.createDraft(token, inv);
    STEP(3, `Taslak oluşturuldu (ETTN: ${uuid})`);

    STEP(4, 'Taslak listesinde doğrulanıyor');
    const docs = await earsiv.listDocuments(token, date, date);
    const found = docs.find((d) => d.ettn === uuid || d.uuid === uuid);
    if (!found) {
      throw new Error('Taslak listede bulunamadı (oluşturuldu ama doğrulanamadı)');
    }
    STEP(4, `Taslak listede görüldü (belge no: ${found.belgeNumarasi || 'atanmadı'})`);

    STEP(5, 'Oturum kapatılıyor');
    await earsiv.logout(token);
    console.log('\nSONUÇ: BAŞARILI — e-Arşiv fatura bağlantısı çalışıyor (taslak aşaması).');
    console.log('İmza (SMS) adımı Okan onayıyla ayrıca çalıştırılır.');
  } catch (e) {
    try {
      await earsiv.logout(token);
    } catch {
      /* oturum zaten kapalı */
    }
    console.error(`\nSONUÇ: BAŞARISIZ — ${e.message}`);
    process.exit(1);
  }
}

main();
