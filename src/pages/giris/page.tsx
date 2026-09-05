import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import GoogleSignInButton from '@/components/feature/GoogleSignInButton';
import { useAuth } from '@/hooks/useAuth';
import { ASSETS } from '@/lib/assets';
import { GOOGLE_CLIENT_ID } from '@/lib/site';
import { homeForRole } from '@/lib/redirect';

export default function LoginPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogle = useCallback(
    async (credential: string) => {
      setError('');
      setIsLoading(true);
      const result = await signInWithGoogle(credential);
      setIsLoading(false);
      if (result.success) navigate(homeForRole(result.profile?.role));
      else setError(result.error || 'Google girişi başarısız');
    },
    [navigate, signInWithGoogle],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await signIn(email, password);
    setIsLoading(false);

    if (result.success) {
      navigate(homeForRole(result.profile?.role));
    } else {
      setError(result.error || 'Giriş yapılamadı, lütfen bilgilerinizi kontrol edin.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-md">
          <div className="bg-background-50 dark:bg-background-100 rounded-2xl border border-background-200 dark:border-background-200 p-6 md:p-8 shadow-sm">
            {/* Logo */}
            <div className="text-center mb-6">
              <img
                src={ASSETS.logo}
                alt={t('brand')}
                className="h-14 w-auto mx-auto object-contain mb-3"
              />
              <h1 className="font-heading font-bold text-xl md:text-2xl text-foreground-950 dark:text-foreground-950">
                {t('auth.loginTitle')}
              </h1>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <i className="ri-mail-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background-100 dark:bg-background-50 border border-background-200 dark:border-background-200 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <i className="ri-lock-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400" />
                  <input
                    type="password"
                    name="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background-100 dark:bg-background-50 border border-background-200 dark:border-background-200 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-background-300 text-primary-500 focus:ring-primary-400"
                  />
                  <span className="text-xs text-foreground-600">Beni hatırla</span>
                </label>
                <Link
                  to="/sifremi-unuttum"
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-primary-500 text-white font-medium text-sm rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="ri-loader-4-line animate-spin" />
                    {t('common.loading')}
                  </span>
                ) : (
                  t('auth.loginButton')
                )}
              </button>

              {GOOGLE_CLIENT_ID && (
                <div className="mt-4">
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-background-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-background-50 dark:bg-background-100 text-foreground-500">veya</span>
                    </div>
                  </div>
                  <GoogleSignInButton onCredential={handleGoogle} disabled={isLoading} />
                </div>
              )}

              {/* Honeypot */}
              <input
                type="text"
                name="website_alt"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                readOnly
                className="hp-field"
              />
            </form>

            {/* Register Link */}
            <p className="text-center text-sm text-foreground-600 mt-5">
              {t('auth.noAccount')}{' '}
              <Link to="/kayit" className="text-primary-600 hover:text-primary-700 font-medium">
                {t('auth.registerLink')}
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}