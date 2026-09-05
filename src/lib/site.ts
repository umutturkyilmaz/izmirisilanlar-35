/** Sosyal medya — Railway Web Variables: VITE_SOCIAL_* */
export const SOCIAL_LINKS = {
  instagram: (import.meta.env.VITE_SOCIAL_INSTAGRAM || '').trim(),
  twitter: (import.meta.env.VITE_SOCIAL_TWITTER || '').trim(),
  linkedin: (import.meta.env.VITE_SOCIAL_LINKEDIN || '').trim(),
} as const;

export const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

/** Sitede görünen iletişim bilgileri */
export const CONTACT = {
  email: 'umutata355@gmail.com',
  phone: '+90 530 856 11 03',
  phoneTel: '+905308561103',
} as const;
