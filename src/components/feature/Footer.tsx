import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ASSETS } from '@/lib/assets';

export default function Footer() {
  const { t } = useTranslation('common');

  return (
    <footer className="bg-background-100 dark:bg-background-100 border-t border-background-200 dark:border-background-200">
      <div className="px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img
                src={ASSETS.logo}
                alt={t('brand')}
                className="h-10 w-auto object-contain"
              />
              <span className="font-heading font-bold text-lg text-foreground-950 dark:text-foreground-950">
                {t('brand')}
              </span>
            </Link>
            <p className="text-sm text-foreground-600 dark:text-foreground-600 leading-relaxed max-w-xs">
              {t('footer.description')}
            </p>
            <div className="flex items-center gap-3 mt-4">
              <span
                className="w-9 h-9 rounded-full bg-background-200 dark:bg-background-200 flex items-center justify-center text-foreground-400"
                aria-label="Instagram (yakında)"
                title="Yakında"
              >
                <i className="ri-instagram-line text-lg" />
              </span>
              <span
                className="w-9 h-9 rounded-full bg-background-200 dark:bg-background-200 flex items-center justify-center text-foreground-400"
                aria-label="Twitter (yakında)"
                title="Yakında"
              >
                <i className="ri-twitter-x-line text-lg" />
              </span>
              <span
                className="w-9 h-9 rounded-full bg-background-200 dark:bg-background-200 flex items-center justify-center text-foreground-400"
                aria-label="LinkedIn (yakında)"
                title="Yakında"
              >
                <i className="ri-linkedin-line text-lg" />
              </span>
            </div>
          </div>

          {/* Candidates */}
          <div>
            <h4 className="font-heading font-semibold text-sm text-foreground-950 dark:text-foreground-950 mb-4">
              {t('footer.forCandidates')}
            </h4>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link to="/ilanlar" className="text-sm text-foreground-600 hover:text-primary-600 transition-colors">
                  İş İlanları Ara
                </Link>
              </li>
              <li>
                <Link to="/kayit" className="text-sm text-foreground-600 hover:text-primary-600 transition-colors">
                  Ücretsiz Kayıt Ol
                </Link>
              </li>
              <li>
                <Link to="/profil/aday" className="text-sm text-foreground-600 hover:text-primary-600 transition-colors">
                  CV Oluştur
                </Link>
              </li>
              <li>
                <Link to="/favorilerim" className="text-sm text-foreground-600 hover:text-primary-600 transition-colors">
                  Favori İlanlar
                </Link>
              </li>
            </ul>
          </div>

          {/* Employers */}
          <div>
            <h4 className="font-heading font-semibold text-sm text-foreground-950 dark:text-foreground-950 mb-4">
              {t('footer.forEmployers')}
            </h4>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link to="/paketler" className="text-sm text-foreground-600 hover:text-primary-600 transition-colors">
                  İlan Paketleri / Fiyatlar
                </Link>
              </li>
              <li>
                <Link to="/ilan-ekle" className="text-sm text-foreground-600 hover:text-primary-600 transition-colors">
                  İlan Ver
                </Link>
              </li>
              <li>
                <Link to="/kayit" className="text-sm text-foreground-600 hover:text-primary-600 transition-colors">
                  İşveren Kaydı
                </Link>
              </li>
              <li>
                <Link to="/ilanlarim" className="text-sm text-foreground-600 hover:text-primary-600 transition-colors">
                  İlanlarımı Yönet
                </Link>
              </li>
              <li>
                <Link to="/iletisim" className="text-sm text-foreground-600 hover:text-primary-600 transition-colors">
                  Destek Al
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-heading font-semibold text-sm text-foreground-950 dark:text-foreground-950 mb-4">
              {t('footer.company')}
            </h4>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link to="/hakkimizda" className="text-sm text-foreground-600 hover:text-primary-600 transition-colors">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link to="/iletisim" className="text-sm text-foreground-600 hover:text-primary-600 transition-colors">
                  İletişim
                </Link>
              </li>
              <li>
                <Link to="/kvkk" className="text-sm text-foreground-600 hover:text-primary-600 transition-colors">
                  KVKK
                </Link>
              </li>
              <li>
                <Link to="/gizlilik" className="text-sm text-foreground-600 hover:text-primary-600 transition-colors">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/mesafeli-satis" className="text-sm text-foreground-600 hover:text-primary-600 transition-colors">
                  Mesafeli Satış
                </Link>
              </li>
              <li>
                <Link to="/mesafeli-satis" className="text-sm text-foreground-600 hover:text-primary-600 transition-colors">
                  {t('footer.terms')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-background-200 dark:border-background-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-foreground-500 dark:text-foreground-500">
            &copy; {new Date().getFullYear()} {t('brand')}. {t('footer.rights')}
          </p>
          <p className="text-xs text-foreground-500 dark:text-foreground-500">
            İzmir merkezli - Tüm Türkiye'ye hizmet veriyoruz.
          </p>
        </div>
      </div>
    </footer>
  );
}