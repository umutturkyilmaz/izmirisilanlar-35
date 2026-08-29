import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { useAuth } from '@/hooks/useAuth';
import { ASSETS } from '@/lib/assets';

const LOGO_URL = ASSETS.logo;

export default function RegisterPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();
  const [role, setRole] = useState<'candidate' | 'employer'>('candidate');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [vergiNumarasi, setVergiNumarasi] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    if (role === 'employer') {
      if (!vergiNumarasi || vergiNumarasi.trim().length === 0) {
        setError('İşveren olarak kaydolmak için vergi numarası zorunludur.');
        return;
      }
      if (vergiNumarasi.replace(/\D/g, '').length !== 10) {
        setError('Vergi numarası tam olarak 10 haneli olmalıdır.');
        return;
      }
    }

    setIsLoading(true);

    const result = await signUp({
      email,
      password,
      role,
      fullName,
      phone: phone || undefined,
      city: city || undefined,
      companyName: role === 'employer' ? companyName : undefined,
      vergiNumarasi: role === 'employer' ? vergiNumarasi : undefined,
    });

    setIsLoading(false);

    if (result.success) {
      setSuccess('Hesabınız oluşturuldu! E-posta adresinizi kontrol ederek hesabınızı onaylayın.');
      setTimeout(() => navigate('/giris'), 3000);
    } else {
      setError(result.error || 'Kayıt sırasında bir hata oluştu.');
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    const result = await signInWithGoogle();
    if (!result.success) {
      setGoogleLoading(false);
      setError(
        result.error ||
          'Google ile kayıt şu an kullanılamıyor. Supabase’de Google OAuth yapılandırılmalı.'
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-lg">
          <div className="bg-background-50 dark:bg-background-100 rounded-2xl border border-background-200 dark:border-background-200 p-6 md:p-8 shadow-sm">
            {/* Logo */}
            <div className="text-center mb-6">
              <img
                src={LOGO_URL}
                alt={t('brand')}
                className="h-14 w-auto mx-auto object-contain rounded-lg mb-3"
              />
              <h1 className="font-heading font-bold text-xl md:text-2xl text-foreground-950 dark:text-foreground-950">
                {t('auth.registerTitle')}
              </h1>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-300">
                {success}
              </div>
            )}

            {/* Role Toggle */}
            <div className="flex p-1 bg-background-100 dark:bg-background-50 rounded-lg mb-5">
              <button
                type="button"
                onClick={() => setRole('candidate')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                  role === 'candidate'
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-foreground-600 hover:text-foreground-700'
                }`}
              >
                {t('auth.roleCandidate')}
              </button>
              <button
                type="button"
                onClick={() => setRole('employer')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                  role === 'employer'
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-foreground-600 hover:text-foreground-700'
                }`}
              >
                {t('auth.roleEmployer')}
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t('auth.fullName')}
                </label>
                <div className="relative">
                  <i className="ri-user-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400" />
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ahmet Yılmaz"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background-100 dark:bg-background-50 border border-background-200 dark:border-background-200 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    {t('auth.phone')}
                  </label>
                  <div className="relative">
                    <i className="ri-phone-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="05XX XXX XX XX"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background-100 dark:bg-background-50 border border-background-200 dark:border-background-200 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                    {t('auth.city')}
                  </label>
                  <div className="relative">
                    <i className="ri-map-pin-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400" />
                    <input
                      type="text"
                      name="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="İzmir"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background-100 dark:bg-background-50 border border-background-200 dark:border-background-200 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
                {role === 'employer' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                      {t('auth.companyName')}
                    </label>
                    <div className="relative">
                      <i className="ri-building-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400" />
                      <input
                        type="text"
                        name="companyName"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Şirket Adı"
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background-100 dark:bg-background-50 border border-background-200 dark:border-background-200 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Vergi Numarası - Sadece İşveren */}
              {role === 'employer' && (
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-foreground-700 mb-1.5">
                    <i className="ri-shield-check-line text-accent-600" />
                    Vergi Numarası <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <i className="ri-barcode-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400" />
                    <input
                      type="text"
                      name="vergiNumarasi"
                      required={role === 'employer'}
                      value={vergiNumarasi}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setVergiNumarasi(val);
                      }}
                      placeholder="10 haneli vergi numaranız"
                      maxLength={10}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background-100 dark:bg-background-50 border border-background-200 dark:border-background-200 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all font-mono tracking-widest"
                    />
                  </div>
                  {vergiNumarasi && vergiNumarasi.length < 10 && (
                    <p className="text-xs text-red-500 mt-1">Vergi numarası tam olarak 10 haneli olmalıdır.</p>
                  )}
                  <p className="text-xs text-foreground-400 mt-1.5">
                    Platform güvenliği için zorunludur. Vergi numaranız hiçbir yerde yayınlanmaz, sadece doğrulama amaçlı kullanılır.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                    {t('auth.confirmPassword')}
                  </label>
                  <div className="relative">
                    <i className="ri-lock-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400" />
                    <input
                      type="password"
                      name="confirmPassword"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="********"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background-100 dark:bg-background-50 border border-background-200 dark:border-background-200 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
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
                  t('auth.registerButton')
                )}
              </button>

              {/* Honeypot */}
              <input
                type="text"
                name="phone_alt"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                readOnly
                className="hp-field"
              />
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-background-200 dark:border-background-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-background-50 dark:bg-background-100 text-foreground-400">veya</span>
              </div>
            </div>

            {/* Google Register */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading}
              className="w-full py-2.5 bg-background-100 dark:bg-background-50 border border-background-200 dark:border-background-200 text-foreground-700 font-medium text-sm rounded-lg hover:bg-background-200 transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-60"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {googleLoading ? 'Yönlendiriliyor...' : t('auth.googleRegister')}
            </button>

            {/* Login Link */}
            <p className="text-center text-sm text-foreground-600 mt-5">
              {t('auth.hasAccount')}{' '}
              <Link to="/giris" className="text-primary-600 hover:text-primary-700 font-medium">
                {t('auth.loginLink')}
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}