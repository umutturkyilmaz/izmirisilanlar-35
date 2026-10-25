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
