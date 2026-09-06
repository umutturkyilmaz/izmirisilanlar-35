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

export function getServerPackage(id) {
  if (!id) return null;
  return PACKAGE_CATALOG[String(id)] || null;
}

export function packageCreditsMeta(pkg) {
  return {
    duration_days: pkg.duration_days,
    featured: pkg.featured_count > 0,
    featured_count: pkg.featured_count,
    credits_count: pkg.credits_count,
  };
}
