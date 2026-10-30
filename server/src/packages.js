/** Sunucu tarafı sabit paket kataloğu — client fiyat/hak gönderemez */
export const PACKAGE_CATALOG = {
  standart: {
    id: 'standart',
    name: 'Standart İlan',
    price: 499,
    duration_days: 7,
    credits_count: 1,
    featured_count: 0,
  },
  'one-cikan': {
    id: 'one-cikan',
    name: 'Öne Çıkan İlan',
    price: 899,
    duration_days: 14,
    credits_count: 1,
    featured_count: 1,
  },
  kurumsal: {
    id: 'kurumsal',
    name: 'Kurumsal Paket',
    price: 2499,
    duration_days: 30,
    credits_count: 5,
    featured_count: 2,
  },
};

/** Ek hizmetler (addon) — pakete bağımsız tek seferlik hizmetler */
export const ADDON_CATALOG = {
  'google-business-profile': {
    id: 'google-business-profile',
    name: 'Google İşletme Profili Düzenleme',
    price: 799,
    description: 'Google Haritalar ve Arama\'da işletme profilini profesyonel hale getirme. Profil bilgileri, fotoğraflar, SEO açıklama, hizmet/ürün listesi, inceleme yönetimi, Google Gönderiler şablonu, performans raporu. 3 iş günü içinde erişim ve onayla yayın.',
  },
  'video-ilan-reels': {
    id: 'video-ilan-reels',
    name: 'Video İlan + Reels',
    price: 799,
    description: 'İş ilanınız için 9:16 dikey Reels/TikTok/Shorts videosu otomatik üretilir. İlan başlığı, ilçe, maaş aralığı ve şirket adınızla markalı. 3 iş günü içinde indirme linki e-posta ve panele gelir. Sosyal medyada ilanınizi öne çıkarın, başvuru sayısını artırın.',
  },
};

/** Paket fiyatları KDV hariçtir; tahsilat KDV dahil tutar üzerinden yapılır */
export const KDV_RATE = 20;

/** Kuruş hassasiyetinde KDV dökümü: { net, vat, gross } */
export function priceBreakdown(netPrice) {
  const netKurus = Math.round(Number(netPrice) * 100);
  const vatKurus = Math.round((netKurus * KDV_RATE) / 100);
  return {
    net: netKurus / 100,
    vat: vatKurus / 100,
    gross: (netKurus + vatKurus) / 100,
    rate: KDV_RATE,
  };
}

export function getServerPackage(id) {
  if (!id) return null;
  return PACKAGE_CATALOG[String(id)] || null;
}

export function getAddonService(id) {
  if (!id) return null;
  return ADDON_CATALOG[String(id)] || null;
}

export function packageCreditsMeta(pkg) {
  return {
    duration_days: pkg.duration_days,
    featured: pkg.featured_count > 0,
    featured_count: pkg.featured_count,
    credits_count: pkg.credits_count,
  };
}