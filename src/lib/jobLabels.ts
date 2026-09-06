/** Ortak ilan etiketleri — create/edit/list/detail uyumu */

export const JOB_TYPE_OPTIONS = [
  { value: 'tam-zamanli', label: 'Tam Zamanlı' },
  { value: 'yari-zamanli', label: 'Yarı Zamanlı' },
  { value: 'staj', label: 'Staj' },
  { value: 'uzaktan', label: 'Uzaktan' },
  { value: 'freelance', label: 'Freelance' },
] as const;

export const EXPERIENCE_OPTIONS = [
  { value: 'junior', label: 'Junior (0-2 Yıl)' },
  { value: 'mid', label: 'Mid-Level (2-5 Yıl)' },
  { value: 'senior', label: 'Senior (5+ Yıl)' },
  { value: 'her-seviye', label: 'Her Seviye' },
] as const;

export const EDUCATION_OPTIONS = [
  { value: 'farketmez', label: 'Farketmez' },
  { value: 'ilkokul', label: 'İlkokul' },
  { value: 'ortaokul', label: 'Ortaokul' },
  { value: 'lise', label: 'Lise' },
  { value: 'on-lisans', label: 'Ön Lisans' },
  { value: 'lisans', label: 'Lisans' },
  { value: 'yuksek-lisans', label: 'Yüksek Lisans' },
  { value: 'doktora', label: 'Doktora' },
] as const;

/** range = sayısal aralık, asgari = Asgari Ücret metni */
export const SALARY_TYPE_OPTIONS = [
  { value: 'range', label: 'Maaş aralığı (TL)' },
  { value: 'asgari', label: 'Asgari Ücret' },
  { value: 'gizli', label: 'Belirtilmedi' },
] as const;

export const JOB_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  JOB_TYPE_OPTIONS.map((o) => [o.value, o.label]),
);

export const EXPERIENCE_LABELS: Record<string, string> = {
  ...Object.fromEntries(EXPERIENCE_OPTIONS.map((o) => [o.value, o.label])),
  'yeni-mezun': 'Yeni mezun',
  '1-3': '1-3 yıl',
  '3-5': '3-5 yıl',
  '5-plus': '5+ yıl',
};

export const EDUCATION_LABELS: Record<string, string> = Object.fromEntries(
  EDUCATION_OPTIONS.map((o) => [o.value, o.label]),
);

/**
 * Türkçe / İngilizce maaş girdisini tam sayı TL'ye çevirir.
 * Örn: "28.075,20" | "28075.20" | "28075" → 28075
 * (Kuruş yuvarlanır; DB INT)
 */
export function parseSalaryInput(raw: string | number | null | undefined): number | null {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) return null;
    return Math.round(raw);
  }
  let s = String(raw).trim().replace(/\s/g, '').replace(/tl/gi, '');
  if (!s) return null;
  // 28.075,20 (TR) → 28075.20
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    // 28075,20 veya 28,075
    const parts = s.split(',');
    if (parts[1]?.length <= 2) s = parts.join('.');
    else s = s.replace(/,/g, '');
  } else if ((s.match(/\./g) || []).length > 1) {
    // 28.075.20 → binlik ayırıcı
    s = s.replace(/\./g, '');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    // 28.075 → binlik
    s = s.replace(/\./g, '');
  }
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

export function formatSalary(
  min: number | null | undefined,
  max: number | null | undefined,
  salaryType?: string | null,
): string {
  if (salaryType === 'asgari') return 'Asgari Ücret';
  if (salaryType === 'gizli') return 'Belirtilmedi';
  if (min == null && max == null) return 'Belirtilmedi';
  const fmt = (n: number) => n.toLocaleString('tr-TR');
  if (min != null && max != null) {
    if (min === max) return `${fmt(min)} TL`;
    return `${fmt(min)} - ${fmt(max)} TL`;
  }
  if (min != null) return `${fmt(min)} TL+`;
  return `${fmt(max!)} TL'ye kadar`;
}
