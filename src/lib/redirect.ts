/** Giriş sonrası rol bazlı yönlendirme */
export function homeForRole(role?: string | null) {
  if (role === 'admin') return '/admin';
  if (role === 'employer') return '/profil/isveren';
  if (role === 'candidate') return '/profil/aday';
  return '/';
}
