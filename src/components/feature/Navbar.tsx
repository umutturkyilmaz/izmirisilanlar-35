import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { ASSETS } from '@/lib/assets';
import NotificationBell from '@/components/feature/NotificationBell';

const LOGO_URL = ASSETS.logo;

export default function Navbar() {
  const { t } = useTranslation('common');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setIsProfileMenuOpen(false);
    if (isProfileMenuOpen) {
      setTimeout(() => document.addEventListener('click', handleClickOutside), 0);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isProfileMenuOpen]);

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('darkMode', String(next));
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setIsProfileMenuOpen(false);
    navigate('/');
  };

  const toggleMobile = () => setIsMobileMenuOpen((p) => !p);

  const navLinks = [
    { label: t('nav.home'), path: '/' },
    { label: t('nav.jobs'), path: '/ilanlar' },
    { label: t('nav.packages'), path: '/paketler' },
    { label: t('nav.about'), path: '/hakkimizda' },
    { label: t('nav.contact'), path: '/iletisim' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const profilePath = profile?.role === 'employer' ? '/profil/isveren' : '/profil/aday';

  const showVerificationWarning = profile?.role === 'employer' && profile.dogrulama_durumu !== 'verified';

  return (
    <>
      {/* Verification Warning Banner for Employers */}
      {showVerificationWarning && (
        <div className="sticky top-0 z-[60] bg-yellow-50 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-700">
          <div className="px-4 md:px-6 lg:px-8 py-2 flex items-center justify-center gap-2">
            <i className="ri-shield-cross-line text-yellow-700 dark:text-yellow-400 text-sm" />
            <p className="text-xs md:text-sm text-yellow-800 dark:text-yellow-300 font-medium">
              {profile.dogrulama_durumu === 'pending'
                ? 'Kimlik doğrulamanız inceleniyor. Onaylanana kadar ilan veremezsiniz.'
                : profile.dogrulama_durumu === 'rejected'
                  ? 'Kimlik doğrulamanız reddedildi. Lütfen profilinizi güncelleyin.'
                  : 'İlan vermek için kimlik doğrulaması zorunludur. Vergi numaranızı profil sayfanızdan girin.'}
            </p>
            <Link
              to="/profil/isveren"
              className="ml-2 px-3 py-1 text-xs font-medium bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded-md hover:bg-yellow-300 dark:hover:bg-yellow-700 transition-colors whitespace-nowrap"
            >
              Profile Git
            </Link>
          </div>
        </div>
      )}

    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-background-50/95 backdrop-blur-md shadow-sm dark:bg-background-100/95'
          : 'bg-transparent'
      }`}
    >
      <nav className="flex items-center justify-between px-4 md:px-6 lg:px-8 py-3 md:py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img
            src={LOGO_URL}
            alt="İzmir İş İlanları 35"
            className="h-10 w-auto object-contain rounded-md"
          />
          <span className="hidden sm:block font-heading font-bold text-lg md:text-xl text-foreground-950 dark:text-foreground-950">
            {t('brand')}
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                isActive(link.path)
                  ? 'text-primary-600 bg-primary-50/60 dark:text-primary-400 dark:bg-primary-900/20'
                  : 'text-foreground-700 hover:text-primary-600 hover:bg-primary-50/40 dark:text-foreground-700 dark:hover:text-primary-400'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          <NotificationBell />
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDark}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-foreground-600 hover:bg-background-200 transition-colors"
            aria-label={isDark ? t('common.lightMode') : t('common.darkMode')}
          >
            {isDark ? (
              <i className="ri-sun-line text-lg" />
            ) : (
              <i className="ri-moon-line text-lg" />
            )}
          </button>

          {user && profile ? (
            <>
              {/* Desktop Profile Menu */}
              <div className="hidden md:block relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsProfileMenuOpen(!isProfileMenuOpen); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-background-200 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm">
                    {profile.full_name?.charAt(0)?.toUpperCase() || 'K'}
                  </div>
                  <span className="text-sm font-medium text-foreground-700 max-w-[100px] truncate">
                    {profile.full_name || 'Kullanıcı'}
                  </span>
                  <i className={`${isProfileMenuOpen ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} text-foreground-500 text-sm`} />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-background-50 dark:bg-background-100 rounded-xl border border-background-200 dark:border-background-200 shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-background-200">
                      <p className="text-sm font-medium text-foreground-950">{profile.full_name}</p>
                      <p className="text-xs text-foreground-500">{profile.role === 'employer' ? 'İşveren' : 'Aday'}</p>
                    </div>
                    <Link
                      to={profilePath}
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground-700 hover:bg-background-100 dark:hover:bg-background-200 transition-colors"
                    >
                      <i className="ri-user-line text-base" />
                      {t('nav.profile')}
                    </Link>
                    {profile.role === 'candidate' && (
                      <>
                        <Link
                          to="/basvurularim"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground-700 hover:bg-background-100 dark:hover:bg-background-200 transition-colors"
                        >
                          <i className="ri-file-list-line text-base" />
                          {t('nav.myApplications')}
                        </Link>
                        <Link
                          to="/favorilerim"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground-700 hover:bg-background-100 dark:hover:bg-background-200 transition-colors"
                        >
                          <i className="ri-heart-line text-base" />
                          {t('nav.favorites')}
                        </Link>
                      </>
                    )}
                    {profile.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground-700 hover:bg-background-100 dark:hover:bg-background-200 transition-colors"
                      >
                        <i className="ri-admin-line text-base" />
                        {t('nav.admin')}
                      </Link>
                    )}
                    <hr className="my-1 border-background-200" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-background-100 dark:hover:bg-background-200 transition-colors"
                    >
                      <i className="ri-logout-box-line text-base" />
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>

              {/* Post Job Button (employer) */}
              {profile.role === 'employer' && (
                <Link
                  to="/ilan-ekle"
                  className="hidden lg:inline-flex px-4 py-2 text-sm font-medium bg-accent-500 text-background-50 rounded-lg hover:bg-accent-600 transition-colors whitespace-nowrap"
                >
                  <i className="ri-add-line mr-1" />
                  {t('nav.postJob')}
                </Link>
              )}
            </>
          ) : (
            <>
              {/* Desktop CTA (not logged in) */}
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/giris"
                  className="px-4 py-2 text-sm font-medium text-foreground-700 hover:text-primary-600 transition-colors whitespace-nowrap"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/kayit"
                  className="px-4 py-2 text-sm font-medium bg-primary-500 text-background-50 rounded-lg hover:bg-primary-600 transition-colors whitespace-nowrap"
                >
                  {t('nav.register')}
                </Link>
              </div>

              {/* Post Job Button (not logged in) */}
              <Link
                to="/ilan-ekle"
                className="hidden lg:inline-flex px-4 py-2 text-sm font-medium bg-accent-500 text-background-50 rounded-lg hover:bg-accent-600 transition-colors whitespace-nowrap"
              >
                <i className="ri-add-line mr-1" />
                {t('nav.postJob')}
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={toggleMobile}
            className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-foreground-700 hover:bg-background-200 transition-colors"
            aria-label="Menü"
          >
            <i className={`ri-${isMobileMenuOpen ? 'close' : 'menu'}-line text-xl`} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background-50 border-t border-background-200 dark:bg-background-100 dark:border-background-200">
          <div className="px-4 py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'text-primary-600 bg-primary-50/60 dark:text-primary-400 dark:bg-primary-900/20'
                    : 'text-foreground-700 hover:bg-background-200 dark:text-foreground-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <hr className="my-1 border-background-200" />
            {user && profile ? (
              <>
                <Link
                  to={profilePath}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium text-foreground-700 hover:bg-background-200 transition-colors"
                >
                  <i className="ri-user-line mr-2" />
                  {t('nav.profile')}
                </Link>
                {profile.role === 'candidate' && (
                  <>
                    <Link
                      to="/basvurularim"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-3 py-2.5 rounded-lg text-sm font-medium text-foreground-700 hover:bg-background-200 transition-colors"
                    >
                      <i className="ri-file-list-line mr-2" />
                      {t('nav.myApplications')}
                    </Link>
                    <Link
                      to="/favorilerim"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-3 py-2.5 rounded-lg text-sm font-medium text-foreground-700 hover:bg-background-200 transition-colors"
                    >
                      <i className="ri-heart-line mr-2" />
                      {t('nav.favorites')}
                    </Link>
                  </>
                )}
                {profile.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-3 py-2.5 rounded-lg text-sm font-medium text-foreground-700 hover:bg-background-200 transition-colors"
                  >
                    <i className="ri-admin-line mr-2" />
                    {t('nav.admin')}
                  </Link>
                )}
                <button
                  onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-background-200 transition-colors text-left"
                >
                  <i className="ri-logout-box-line mr-2" />
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/giris"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium text-foreground-700 hover:bg-background-200 transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/kayit"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium bg-primary-500 text-background-50 text-center hover:bg-primary-600 transition-colors"
                >
                  {t('nav.register')}
                </Link>
              </>
            )}
            <Link
              to="/ilan-ekle"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-medium bg-accent-500 text-background-50 text-center hover:bg-accent-600 transition-colors"
            >
              <i className="ri-add-line mr-1" />
              {t('nav.postJob')}
            </Link>
          </div>
        </div>
      )}
    </header>
    </>
  );
}