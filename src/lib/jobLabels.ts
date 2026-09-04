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

export const JOB_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  JOB_TYPE_OPTIONS.map((o) => [o.value, o.label]),
);

export const EXPERIENCE_LABELS: Record<string, string> = {
  ...Object.fromEntries(EXPERIENCE_OPTIONS.map((o) => [o.value, o.label])),
  // Eski/edit değerleri
  'yeni-mezun': 'Yeni mezun',
  '1-3': '1-3 yıl',
  '3-5': '3-5 yıl',
  '5-plus': '5+ yıl',
};

export function formatSalary(min: number | null | undefined, max: number | null | undefined): string {
  if (min == null && max == null) return 'Belirtilmedi';
  if (min != null && max != null) {
    return `${min.toLocaleString('tr-TR')} - ${max.toLocaleString('tr-TR')} TL`;
  }
  if (min != null) return `${min.toLocaleString('tr-TR')} TL+`;
  return `${max!.toLocaleString('tr-TR')} TL'ye kadar`;
}
