/** Sosyal medya — Railway Web Variables: VITE_SOCIAL_* */
export const SOCIAL_LINKS = {
  instagram: (import.meta.env.VITE_SOCIAL_INSTAGRAM || '').trim(),
  twitter: (import.meta.env.VITE_SOCIAL_TWITTER || '').trim(),
  linkedin: (import.meta.env.VITE_SOCIAL_LINKEDIN || '').trim(),
} as const;

export const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

/** Sitede görünen iletişim — WhatsApp odaklı */
export const CONTACT = {
  email: 'umutata355@gmail.com',
  phone: '+90 530 856 11 03',
  phoneTel: '+905308561103',
  whatsapp: '905308561103',
} as const;

/** Hata bildirimi / site görüşleri WhatsApp */
export const FEEDBACK_WHATSAPP = {
  phone: '+90 555 267 77 39',
  whatsapp: '905552677739',
} as const;

export function whatsappUrl(digits: string, text?: string) {
  const base = `https://wa.me/${digits.replace(/\D/g, '')}`;
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}
