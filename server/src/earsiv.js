import crypto from 'node:crypto';

/**
 * GİB e-Arşiv Portal istemcisi (resmi API yoktur; portalın kendi uç noktaları).
 * Komutlar mlevent/fatura (PHP) ile aynıdır. Fatura, SMS ile imzalanana kadar TASLAKTIR.
 *
 * Env:
 *   EARSIV_ENABLED=true
 *   EARSIV_USER / EARSIV_PASS   — e-Arşiv Portal kullanıcı kodu ve şifresi (Dijital Vergi Dairesi)
 *   EARSIV_MODE=TEST            — earsivportaltest + otomatik test hesabı (mali değeri yoktur)
 */

const GATEWAYS = {
  PROD: 'https://earsivportal.efatura.gov.tr',
  TEST: 'https://earsivportaltest.efatura.gov.tr',
};

function mode() {
  return String(process.env.EARSIV_MODE || 'PROD').toUpperCase() === 'TEST' ? 'TEST' : 'PROD';
}

export function isEarsivReady() {
  if (process.env.EARSIV_ENABLED !== 'true') return false;
  // TEST modunda da gerçek kimlik bilgisi istenir: GİB test portalı
  // "kullaniciOner" ile kendi test hesabını üretir, ama kullanıcı kodu/şifre
  // yine de tanımlı olmalıdır (aksi halde login anında net hata verilir).
  return Boolean(process.env.EARSIV_USER && process.env.EARSIV_PASS);
}

export function earsivMode() {
  return mode();
}

const HEADERS = {
  accept: '*/*',
  'accept-language': 'tr,en-US;q=0.9,en;q=0.8',
  'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
};

async function post(path, params) {
  const r = await fetch(`${GATEWAYS[mode()]}${path}`, {
    method: 'POST',
    headers: HEADERS,
    body: new URLSearchParams(params).toString(),
    signal: AbortSignal.timeout(30000),
  });
  const text = await r.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`GİB beklenmeyen yanıt (HTTP ${r.status})`);
  }
  if (json.error && json.error !== '0') {
    const raw = json.messages?.[0];
    throw new Error(typeof raw === 'string' ? raw : raw?.text || 'GİB e-Arşiv hatası');
  }
  return json;
}

async function testCredentials() {
  const json = await post('/earsiv-services/esign', { assoscmd: 'kullaniciOner', rtype: 'json' });
  if (!json.userid) throw new Error('GİB test hesabı alınamadı (tüm test hesapları kullanımda olabilir)');
  return { user: json.userid, pass: '1' };
}

export async function login() {
  const creds =
    mode() === 'TEST'
      ? await testCredentials()
      : { user: process.env.EARSIV_USER, pass: process.env.EARSIV_PASS };
  const json = await post('/earsiv-services/assos-login', {
    assoscmd: mode() === 'TEST' ? 'login' : 'anologin',
    rtype: 'json',
    userid: creds.user,
    sifre: creds.pass,
    sifre2: creds.pass,
    parola: '1',
  });
  if (!json.token) throw new Error('GİB e-Arşiv girişi başarısız (kullanıcı kodu/şifre)');
  return json.token;
}

export async function logout(token) {
  try {
    await post('/earsiv-services/assos-login', { assoscmd: 'logout', rtype: 'json', token });
  } catch {
    /* oturum zaten kapanmış olabilir */
  }
}

async function dispatch(token, cmd, pageName, data = {}) {
  const json = await post('/earsiv-services/dispatch', {
    cmd,
    callid: crypto.randomUUID(),
    pageName,
    token,
    jp: JSON.stringify(data),
  });
  return json.data;
}

/** İstanbul saatine göre dd/mm/yyyy ve HH:mm:ss */
export function trNow(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('tr-TR', {
      timeZone: 'Europe/Istanbul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return { date: `${parts.day}/${parts.month}/${parts.year}`, time: `${parts.hour}:${parts.minute}:${parts.second}` };
}

export async function getUserData(token) {
  return dispatch(token, 'EARSIV_PORTAL_KULLANICI_BILGILERI_GETIR', 'RG_KULLANICI');
}

/** VKN/TCKN ile GİB sicilinden unvan / vergi dairesi */
export async function getRecipientData(token, taxOrTrId) {
  try {
    return await dispatch(token, 'SICIL_VEYA_MERNISTEN_BILGILERI_GETIR', 'RG_BASITFATURA', {
      vknTcknn: taxOrTrId,
    });
  } catch {
    return null;
  }
}

const money = (n) => Number(n).toFixed(2);

/**
 * Tek kalemli hizmet faturası taslağı.
 * @param {object} inv { uuid, date, time, buyer:{taxId,title,name,surname,taxOffice,address,city,email,phone},
 *                      itemName, net, vat, vatRate, gross, note, orderNumber }
 */
export async function createDraft(token, inv) {
  const data = {
    faturaUuid: inv.uuid,
    belgeNumarasi: '',
    faturaTarihi: inv.date,
    saat: inv.time,
    paraBirimi: 'TRY',
    dovzTLkur: '0',
    faturaTipi: 'SATIS',
    hangiTip: '5000/30000',
    siparisNumarasi: inv.orderNumber || '',
    siparisTarihi: inv.orderNumber ? inv.date : '',
    irsaliyeNumarasi: '',
    irsaliyeTarihi: '',
    fisNo: '',
    fisTarihi: '',
    fisSaati: ' ',
    fisTipi: ' ',
    zRaporNo: '',
    okcSeriNo: '',
    vknTckn: inv.buyer.taxId,
    aliciUnvan: inv.buyer.title || '',
    aliciAdi: inv.buyer.name || '',
    aliciSoyadi: inv.buyer.surname || '',
    bulvarcaddesokak: inv.buyer.address || '',
    binaAdi: '',
    binaNo: '',
    kapiNo: '',
    kasabaKoy: '',
    mahalleSemtIlce: '',
    sehir: inv.buyer.city || ' ',
    ulke: 'Türkiye',
    postaKodu: '',
    tel: inv.buyer.phone || '',
    fax: '',
    eposta: inv.buyer.email || '',
    websitesi: '',
    vergiDairesi: inv.buyer.taxOffice || '',
    komisyonOrani: 0,
    navlunOrani: 0,
    hammaliyeOrani: 0,
    nakliyeOrani: 0,
    komisyonTutari: '0',
    navlunTutari: '0',
    hammaliyeTutari: '0',
    nakliyeTutari: '0',
    komisyonKDVOrani: 0,
    navlunKDVOrani: 0,
    hammaliyeKDVOrani: 0,
    nakliyeKDVOrani: 0,
    komisyonKDVTutari: '0',
    navlunKDVTutari: '0',
    hammaliyeKDVTutari: '0',
    nakliyeKDVTutari: '0',
    gelirVergisiOrani: 0,
    bagkurTevkifatiOrani: 0,
    gelirVergisiTevkifatiTutari: '0',
    bagkurTevkifatiTutari: '0',
    halRusumuOrani: 0,
    ticaretBorsasiOrani: 0,
    milliSavunmaFonuOrani: 0,
    digerOrani: 0,
    halRusumuTutari: '0',
    ticaretBorsasiTutari: '0',
    milliSavunmaFonuTutari: '0',
    digerTutari: '0',
    halRusumuKDVOrani: 0,
    ticaretBorsasiKDVOrani: 0,
    milliSavunmaFonuKDVOrani: 0,
    digerKDVOrani: 0,
    halRusumuKDVTutari: '0',
    ticaretBorsasiKDVTutari: '0',
    milliSavunmaFonuKDVTutari: '0',
    digerKDVTutari: '0',
    iadeTable: [],
    ozelMatrahTutari: '0',
    ozelMatrahOrani: 0,
    ozelMatrahVergiTutari: '0',
    vergiCesidi: ' ',
    malHizmetTable: [
      {
        iskontoArttm: 'İskonto',
        malHizmet: inv.itemName,
        miktar: 1,
        birim: 'C62',
        birimFiyat: money(inv.net),
        fiyat: money(inv.net),
        iskontoOrani: 0,
        iskontoTutari: '0.00',
        iskontoNedeni: '',
        malHizmetTutari: money(inv.net),
        kdvOrani: String(inv.vatRate),
        vergiOrani: 0,
        kdvTutari: money(inv.vat),
        vergininKdvTutari: '0.00',
      },
    ],
    tip: 'İskonto',
    matrah: money(inv.net),
    malhizmetToplamTutari: money(inv.net),
    toplamIskonto: '0.00',
    hesaplanankdv: money(inv.vat),
    vergilerToplami: money(inv.vat),
    vergilerDahilToplamTutar: money(inv.gross),
    toplamMasraflar: '0',
    odenecekTutar: money(inv.gross),
    not: inv.note || '',
  };
  const result = await dispatch(token, 'EARSIV_PORTAL_FATURA_OLUSTUR', 'RG_BASITFATURA', data);
  if (!String(result || '').includes('başarıyla')) {
    throw new Error(String(result || 'Taslak oluşturulamadı'));
  }
  return inv.uuid;
}

/** Tarih aralığındaki belgeler (dd/mm/yyyy) */
export async function listDocuments(token, startDate, endDate) {
  const data = await dispatch(token, 'EARSIV_PORTAL_TASLAKLARI_GETIR', 'RG_TASLAKLAR', {
    baslangic: startDate,
    bitis: endDate,
    hangiTip: '5000/30000',
  });
  return Array.isArray(data) ? data : [];
}

export async function getHtml(token, uuid, signed) {
  return dispatch(token, 'EARSIV_PORTAL_FATURA_GOSTER', 'RG_TASLAKLAR', {
    ettn: uuid,
    onayDurumu: signed ? 'Onaylandı' : 'Onaylanmadı',
  });
}

/** Portala kayıtlı cep telefonuna imza SMS'i gönderir; { oid, phone } */
export async function startSmsVerification(token) {
  const phoneData = await dispatch(token, 'EARSIV_PORTAL_TELEFONNO_SORGULA', 'RG_BASITTASLAKLAR');
  const phone = phoneData?.telefon;
  if (!phone) throw new Error('e-Arşiv Portalı’nda kayıtlı cep telefonu yok (portal → Kullanıcı Bilgileri)');
  const data = await dispatch(token, 'EARSIV_PORTAL_SMSSIFRE_GONDER', 'RG_SMSONAY', {
    CEPTEL: phone,
    KCEPTEL: false,
    TIP: '',
  });
  if (!data?.oid) throw new Error('SMS gönderilemedi');
  return { oid: data.oid, phone };
}

/** SMS koduyla taslakları imzalar (resmi faturaya dönüştürür) */
export async function completeSmsVerification(token, code, oid, uuids) {
  const data = await dispatch(token, '0lhozfib5410mp', 'RG_SMSONAY', {
    DATA: uuids.map((ettn) => ({ belgeTuru: 'FATURA', ettn })),
    SIFRE: String(code).trim(),
    OID: oid,
    OPR: 1,
  });
  if (String(data?.sonuc) !== '1') throw new Error(data?.msg || 'SMS doğrulaması başarısız');
  return true;
}
