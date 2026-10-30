export type Sektor = {
  slug: string;
  label: string;
  apiCategory?: string;
  description: string;
};

export const SEKTORLER: Sektor[] = [
  { slug: 'kuaför', label: 'Kuaför', description: 'Kuaför, güzellik salonu ve saç bakımı ilanları' },
  { slug: 'kafe', label: 'Kafe', description: 'Kafe, restoran ve içecek sektörü ilanları' },
  { slug: 'emlakci', label: 'Emlakçı', description: 'Emlak, gayrimenkul ve satış ilanları' },
  { slug: 'teknoloji', label: 'Teknoloji', apiCategory: 'Teknoloji', description: 'Yazılım, IT ve teknoloji ilanları' },
  { slug: 'satis-pazarlama', label: 'Satış & Pazarlama', apiCategory: 'Satis & Pazarlama', description: 'Satış, pazarlama ve müşteri ilişkileri ilanları' },
  { slug: 'muhasebe-finans', label: 'Muhasebe & Finans', apiCategory: 'Muhasebe & Finans', description: 'Muhasebe, finans ve bankacılık ilanları' },
  { slug: 'insan-kaynaklari', label: 'İnsan Kaynakları', apiCategory: 'Insan Kaynaklari', description: 'İnsan kaynakları ve personel ilanları' },
  { slug: 'uretim', label: 'Üretim', apiCategory: 'Uretim', description: 'Üretim, imalat ve kalite ilanları' },
  { slug: 'lojistik', label: 'Lojistik', apiCategory: 'Lojistik', description: 'Lojistik, nakliye ve depolama ilanları' },
  { slug: 'saglik', label: 'Sağlık', apiCategory: 'Saglik', description: 'Sağlık ve sosyal hizmet ilanları' },
  { slug: 'egitim', label: 'Eğitim', apiCategory: 'Egitim', description: 'Eğitim, öğretmen ve akademi ilanları' },
  { slug: 'turizm-otelcilik', label: 'Turizm & Otelcilik', apiCategory: 'Turizm & Otelcilik', description: 'Turizm, otelcilik ve gıda hizmetleri ilanları' },
  { slug: 'gida', label: 'Gıda', apiCategory: 'Gıda', description: 'Gıda üretimi ve gıda sektörü ilanları' },
  { slug: 'diger', label: 'Diğer', apiCategory: 'Diger', description: 'Diğer alanlardaki güncel iş ilanları' },
];

export function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/İ/g, 'i').replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function findSektor(slug: string): Sektor | undefined {
  const normalized = normalizeSlug(slug);
  return SEKTORLER.find((sector) => normalizeSlug(sector.slug) === normalized);
}

export function sektorPath(sector: Sektor): string {
  return `/sektor/${sector.slug}`;
}
