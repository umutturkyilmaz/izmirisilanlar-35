export interface JobPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: 'TRY';
  durationDays: number;
  features: string[];
  popular?: boolean;
  badge?: string;
}

export const JOB_PACKAGES: JobPackage[] = [
  {
    id: 'standart',
    name: 'Standart İlan',
    description: 'Tek iş ilanı yayınlama hakkı. 7 gün boyunca aktif kalır.',
    price: 499,
    currency: 'TRY',
    durationDays: 7,
    features: [
      '1 iş ilanı yayınlama hakkı (anında yayın)',
      '7 gün yayın süresi',
      'İzmir ve Türkiye görünürlüğü',
      'Başvuru paneli erişimi',
      'Uygulama içi bildirimler',
    ],
  },
  {
    id: 'one-cikan',
    name: 'Öne Çıkan İlan',
    description: 'Ana sayfada ve liste üstünde öne çıkan iş ilanı paketi. 14 gün aktif kalır.',
    price: 899,
    currency: 'TRY',
    durationDays: 14,
    popular: true,
    badge: 'En Çok Tercih Edilen',
    features: [
      '1 öne çıkan ilan hakkı (anında yayın)',
      '14 gün yayın süresi',
      'Ana sayfada vitrin alanı',
      'Liste üstü öncelikli sıralama',
      'Başvuru paneli erişimi',
      'Öncelikli destek',
    ],
  },
  {
    id: 'kurumsal',
    name: 'Kurumsal Paket',
    description: 'Aylık 5 ilan hakkı ve kurumsal vitrin avantajları.',
    price: 2499,
    currency: 'TRY',
    durationDays: 30,
    badge: 'Kurumsal',
    features: [
      '5 ilan yayınlama hakkı (anında yayın)',
      '30 gün yayın süresi / ilan',
      '2 öne çıkan ilan hakkı',
      'Şirket profili vurgusu',
      'Başvuru paneli erişimi',
      'Öncelikli destek hattı',
    ],
  },
];

export function getPackageById(id: string): JobPackage | undefined {
  return JOB_PACKAGES.find((p) => p.id === id);
}

export function formatPrice(amount: number, currency: string = 'TRY'): string {
  const whole = Number.isInteger(Math.round(amount * 100) / 100);
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Paket fiyatları KDV hariçtir — sunucudaki server/src/packages.js ile aynı hesap */
export const KDV_RATE = 20;

export function priceBreakdown(netPrice: number) {
  const netKurus = Math.round(netPrice * 100);
  const vatKurus = Math.round((netKurus * KDV_RATE) / 100);
  return { net: netKurus / 100, vat: vatKurus / 100, gross: (netKurus + vatKurus) / 100, rate: KDV_RATE };
}

/** Ek hizmetler — işveren paketine eklenebilir tek seferlik hizmetler */
export interface AddonService {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: 'TRY';
  features: string[];
  icon?: string;
}

export const ADDON_SERVICES: AddonService[] = [
  {
    id: 'google-business-profile',
    name: 'Google İşletme Profili Düzenleme',
    description: 'Google Haritalar ve Arama\'da işletmenizin profilini profesyonel hale getirin. Müşteri güvenini artırın, yerel aramalarda öne çıkın.',
    price: 799,
    currency: 'TRY',
    features: [
      'Profil bilgilerinin tam doldurulması (adres, saatler, telefon, web sitesi, kategori)',
      'Profesyonel işletme fotoğraflarının yüklenmesi ve optimize edilmesi (kapak, profil, ürün/hizmet)',
      'İşletme açıklamasının SEO uyumlu yazılması (anahtar kelimelerle)',
      'Hizmet/ürün listesi oluşturulması (fiyat, açıklama, fotoğraf ile)',
      'Müşteri incelemeleri yönetimi stratejisi ve şablon yanıtlar',
      'Google Gönderiler (Posts) ile kampanya/duyuru paylaşım şablonu',
      'Performans raporu: arama sorguları, görüntülenme, tıklama, yönlendirme verileri',
      'Teslim: 3 iş günü içinde erişim ve onayınızla yayın',
    ],
    icon: 'ri-map-pin-line',
  },
  {
    id: 'video-ilan-reels',
    name: 'Video İlan + Reels',
    description: 'İş ilanınız için 9:16 dikey Reels/TikTok/Shorts videosu otomatik üretilir. İlan başlığı, ilçe, maaş aralığı ve şirket adınızla markalı. 3 iş günü içinde indirme linki e-posta ve panele gelir. Sosyal medyada ilanınızı öne çıkarın, başvuru sayısını artırın.',
    price: 799,
    currency: 'TRY',
    features: [
      'İlan başlığı, ilçe, maaş aralığı ve şirket adıyla 9:16 dikey video (1080x1920)',
      'Reels / TikTok / YouTube Shorts formatında, 12-15 saniye',
      'Markanızla başlık, alt yazı ve kapak görseli',
      'Maaş aralığı ve hızlı başvuru çağrısı (CTA)',
      'MP4 (H.264) + PNG kapak dosyası',
      'İndirme linki e-posta ve işveren paneline 3 iş günü içinde',
      'Sosyal medyada ilanın görünürlüğünü ve başvuru sayısını artırır',
      'Ek maliyet sıfır — ilan onaylandığında otomatik tetiklenir',
    ],
    icon: 'ri-video-line',
  },
];

export function getAddonById(id: string): AddonService | undefined {
  return ADDON_SERVICES.find((s) => s.id === id);
}