import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { jobPath } from '@/lib/jobPath';
import { parseSalaryInput, formatSalary, SALARY_TYPE_OPTIONS } from '@/lib/jobLabels';
import DocumentHead from '@/components/feature/DocumentHead';
import AdSlot from '@/components/feature/AdSlot';
import { SEKTORLER, normalizeSlug, findSektor, sektorPath } from '@/lib/sektorler';
import { EXPERIENCE_LABELS } from '@/lib/jobLabels';
import { SOCIAL_LINKS } from '@/lib/site';
import { ASSETS } from '@/lib/assets';

interface Job {
  id: string;
  slug?: string | null;
  title: string;
  company_name: string;
  city: string;
  sector: string;
  job_type: string;
  experience_level: string;
  salary_type?: string | null;
  salary_min: number | null;
  salary_max: number | null;
  description: string;
  image_url: string | null;
  created_at: string;
}

interface SektorPageProps {
  params: { slug: string };
}

export default function SektorPage() {
  const { params } = useSearchParams();
  const routeParams = useParams<SektorPageParams>({});
  const { slug } = routeParams;

  // Sektör bul
  const sektör = findSektor(slug) || { slug: 'diger', label: 'Diğer', apiCategory: 'Diger', description: 'Diğer alanlardaki güncel iş ilanları' };

  // Filtre parametreleri
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedJobType, setSelectedJobType] = useState('');
  const [selectedExperience, setSelectedExperience] = useState('');

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobCount, setJobCount] = useState(0);

  // Sayfalama
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchJobs();
  }, [slug, searchQuery, selectedCity, selectedJobType, selectedExperience]);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        status: 'active',
        limit: String(limit),
        page: String(page),
      });

      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedCity) params.set('city', selectedCity);
      if (selectedJobType) params.set('job_type', selectedJobType);

      let list = await api<Job[]>(`/api/jobs?${params.toString()}`, { auth: false });

      // Sektör filtresi: API'de sector varsa onu kullan, yoksa slug ile eşleşenleri bul
      if (sektör.apiCategory && sektör.apiCategory !== 'Diger') {
        list = list.filter((j) => j.sector === sektör.apiCategory);
      } else {
        // Slug bazlı eşleşme (küçük/kamera duyarlı)
        const targetSlug = normalizeSlug(sektör.label);
        list = list.filter((j) => {
          const jSector = j.sector || '';
          return normalizeSlug(jSector) === targetSlug || jSector.includes(sektör.label) || sektör.label.includes(jSector);
        });
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        list = list.filter(
          (j) =>
            j.title.toLowerCase().includes(q) ||
            j.company_name.toLowerCase().includes(q) ||
            (j.description && j.description.toLowerCase().includes(q))
        );
      }

      // Experience filter
      if (selectedExperience) {
        list = list.filter((j) => j.experience_level === selectedExperience);
      }

      setJobs(list);
      setJobCount(list.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İlanlar yüklenemedi');
      setJobs([]);
      setJobCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Sayfa başlığı ve meta
  const titleBase = sektör.label;
  const descBase = sektör.description || `${sektör.label} sektöründeki güncel iş ilanları - İzmir İş İlanları 35`;
  const canonical = sektörPath(sektör);

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${titleBase} İş Ilanları`,
    description: descBase,
    url: `${window.location.origin}${canonical}`,
    about: {
      '@type': 'Thing',
      name: titleBase,
    },
    inLanguage: 'tr-TR',
  };

  // DocumentHead ayarları
  DocumentHead({
    title: `${titleBase} | İzmir İş İlanları 35`,
    description: descBase,
    path: canonical,
    jsonLd,
    jsonLdId: 'page',
  });

  // Şehir seçenekleri (unique cities from jobs)
  const cities = useMemo(() => {
    const allCities = ['İzmir', 'Çeşme', 'Foça', 'Karabağlar', 'Karaburun', 'Kemer', 'Menemen', 'Menderes', 'Narlıdere', 'Selçuk', 'Tire', 'Torbalı'];
    return useMemo(() => [...new Set(allCities)].sort(), []);
  }, []);

  // İş tipi seçenekleri
  const jobTypes = useMemo(
    () =>
      JOB_TYPE_OPTIONS.map((o) => ({
        value: o.value,
        label: o.label,
      })),
    []
  );

  // Deneyim seviyesi seçenekleri
  const experienceOptions = useMemo(
    () =>
      EXPERIENCE_OPTIONS.map((o) => ({
        value: o.value,
        label: o.label,
      })),
    []
  );

  return (
    <div className="min-h-screen flex flex-col">
      <DocumentHead path={canonical} />

      <header className="bg-background-50 dark:bg-background-100 border-b border-background-200 dark:border-background-200">
        <div className="px-4 md:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-6 py-4 md:py-6">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors"
              >
                <img
                  src={ASSETS.logo}
                  alt="İzmir İş İlanları 35"
                  className="h-8 w-auto object-contain"
                />
                <span className="font-heading font-bold text-lg text-foreground-950 dark:text-foreground-950">
                  İzmir İş İlanları 35
                </span>
              </Link>

              <div className="hidden sm:block sm:hidden-md sm:hidden-lg">
                <span className="text-xs text-foreground-500 dark:text-foreground-500">
                  {sektör.label} sektörü
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Şehir filtresi */}
              <div className="relative">
                <i className="ri-map-pin-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-400 text-sm" />
                <select
                  onChange={(e) => setSelectedCity(e.target.value)}
                  value={selectedCity || ''}
                  className="appearance-none pl-10 pr-4 py-2.5 rounded-lg bg-background-100 dark:bg-background-50 border border-background-200 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 cursor-pointer w-48"
                >
                  <option value="">Tüm Şehirler</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* İş tipi filtresi */}
              <select
                onChange={(e) => setSelectedJobType(e.target.value)}
                value={selectedJobType || ''}
                className="appearance-none pl-3 pr-2 py-2 rounded-lg bg-background-100 dark:bg-background-50 border border-background-200 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 cursor-pointer"
              >
                <option value="">Tüm İş Tipleri</option>
                {jobTypes.map((jt) => (
                  <option key={jt.value} value={jt.value}>
                    {jt.label}
                  </option>
                ))}
              </select>

              {/* Deneyim filtresi */}
              <select
                onChange={(e) => setSelectedExperience(e.target.value)}
                value={selectedExperience || ''}
                className="appearance-none pl-3 pr-2 py-2 rounded-lg bg-background-100 dark:bg-background-50 border border-background-200 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 cursor-pointer"
              >
                <option value="">Tüm Deneyim Seviyeleri</option>
                {experienceOptions.map((ex) => (
                  <option key={ex.value} value={ex.value}>
                    {ex.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-[var(--site-header-offset,5rem)] pb-12">
        <div className="px-4 md:px-6 lg:px-8 max-w-6xl mx-auto">
          {/* Hero Section */}
          <section className="py-16 md:py-20 bg-background-50 dark:bg-background-50">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl text-foreground-950 dark:text-foreground-950 mb-3">
                {sektör.label} İş Ilanları
              </h1>
              <p className="text-sm md:text-base text-foreground-600 max-w-lg mx-auto">
                {sektör.description || `${sektör.label} sektöründeki güncel iş ilanları`}
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/ilanlar"
                  className="px-5 py-2.5 bg-primary-500 text-white font-medium text-sm rounded-lg hover:bg-primary-600 transition-colors whitespace-nowrap"
                >
                  Tüm İlanları Gör
                </Link>
                {jobCount > 0 && (
                  <span className="text-xs text-foreground-500">
                    {jobCount} ilan bulundu
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Filters and Jobs */}
          <section className="py-8">
            {/* Filters Summary */}
            {jobCount > 0 && (
              <div className="bg-background-100 dark:bg-background-50 rounded-xl border border-background-200 dark:border-background-200 p-4 md:p-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-0">
                  <span className="text-sm text-foreground-600 dark:text-foreground-600">
                    {jobCount} ilan {sektör.label} sektöründen
                  </span>
                  {selectedCity && <span className="text-sm text-foreground-500 dark:text-foreground-500"> · {selectedCity}</span>}
                  {selectedJobType && (
                    <span className="text-sm text-foreground-500 dark:text-foreground-500">
                      · {selectedJobType} {JOB_TYPE_LABELS[selectedJobType] || ''}
                    </span>
                  )}
                  {selectedExperience && (
                    <span className="text-sm text-foreground-500 dark:text-foreground-500">
                      · {selectedExperience}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Jobs Grid */}
            {!loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {jobs.map((job) => (
                  <Link
                    key={job.id}
                    to={jobPath(job)}
                    className="group bg-background-50 dark:bg-background-50 rounded-xl border border-background-200 dark:border-background-200 overflow-hidden hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Image */}
                      <div className="w-full sm:w-24 md:w-28 h-24 sm:h-20 md:h-24 shrink-0 rounded-lg overflow-hidden">
                        <img
                          src={job.image_url || '/assets/job-placeholder.webp'}
                          alt={job.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 p-4 md:p-5">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-heading font-semibold text-base md:text-lg text-foreground-950 dark:text-foreground-950 line-clamp-1">
                            {job.title}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${JOB_TYPE_COLORS[job.job_type] || JOB_TYPE_COLORS['tam-zamanli']}`}>
                            {JOB_TYPE_LABELS[job.job_type] || job.job_type}
                          </span>
                        </div>

                        <p className="text-sm text-foreground-600 mb-2">{job.company_name}</p>

                        <div className="flex items-center gap-3 text-xs text-foreground-500 flex-wrap mb-3">
                          <span className="flex items-center gap-1">
                            <i className="ri-map-pin-line text-foreground-400" />
                            {job.city}
                          </span>
                          <span className="flex items-center gap-1">
                            <i className="ri-briefcase-line text-foreground-400" />
                            {EXPERIENCE_LABELS[job.experience_level] || job.experience_level}
                          </span>
                          {(job.salary_type === 'asgari' || job.salary_min || job.salary_max) && (
                            <span className="flex items-center gap-1 font-medium text-foreground-700">
                              <i className="ri-coins-line text-foreground-400" />
                              {formatSalary(job.salary_min, job.salary_max, job.salary_type)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-foreground-400">
                          <span className="flex items-center gap-1">
                            <i className="ri-time-line" />
                            {new Date(job.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Sonuc yok */}
              {jobCount === 0 && !loading && (
                <div className="col-span-full py-16 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-background-100 dark:bg-background-200 flex items-center justify-center mb-4">
                    <i className="ri-search-line text-2xl text-foreground-400" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg text-foreground-700 mb-2">
                    Sonuç bulunamadı
                  </h3>
                  <p className="text-sm text-foreground-500 mb-4">
                    Farklı arama kriterleri deneyin veya filtreleri sıfırlayın.
                  </p>
                  <Link
                    to="/ilanlar"
                    className="px-5 py-2.5 text-sm font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors whitespace-nowrap"
                  >
                    Tüm İlanları Gör
                  </Link>
                </div>
              )}
            )}

            {/* Loading */}
            {loading && (
              <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-background-50 rounded-xl border border-background-200 h-28 animate-pulse" />
                ))}
              </div>
            )}
          </section>

          {/* Pagination */}
          {!loading && jobCount > limit && (
            <div className="py-8 border-t border-background-200 dark:border-background-200">
              <nav className="flex justify-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  className={`px-4 py-2 rounded-lg border border-background-200 ${
                    page === 1 ? 'bg-primary-500 text-white' : 'text-foreground-600 dark:text-foreground-500 hover:bg-background-100 dark:hover:bg-background-50 transition-colors'
                  }`}
                >
                  Önceki
                </button>
                <span className="text-sm text-foreground-500 dark:text-foreground-500">
                  {page} / {Math.ceil(jobCount / limit)}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  className={`px-4 py-2 rounded-lg border border-background-200 ${
                    Math.ceil(jobCount / limit) <= page ? 'opacity-50 cursor-not-allowed' : 'text-foreground-600 dark:text-foreground-500 hover:bg-background-100 dark:hover:bg-background-50 transition-colors'
                  }`}
                >
                  Sonraki
                </button>
              </nav>
            </div>
          )}
        </section>
      </main>

      {/* Footer internal link */}
      <footer className="bg-background-100 dark:bg-background-100 border-t border-background-200 dark:border-background-200 mt-auto">
        <div className="px-4 md:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <Link to="/" className="flex items-center gap-2 mb-3">
                <img
                  src={ASSETS.logo}
                  alt="İzmir İş İlanları 35"
                  className="h-8 w-auto object-contain"
                />
                <span className="font-heading font-bold text-lg text-foreground-950 dark:text-foreground-950">
                  İzmir İş İlanları 35
                </span>
              </Link>
              <p className="text-sm text-foreground-600 dark:text-foreground-600 leading-relaxed">
                Tüm Türkiye için güncel iş ilanları platformu.
              </p>
            </div>

            <div>
              <h4 className="font-heading font-semibold text-sm text-foreground-950 dark:text-foreground-950 mb-3">
                Sektörlere Göre
              </h4>
              <ul className="flex flex-col gap-2">
                {SEKTORLER.map((s) => (
                  <li key={s.slug}>
                    <Link
                      to={sektorPath(s)}
                      className="text-sm text-foreground-600 hover:text-primary-600 transition-colors"
                    >
                      {s.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-heading font-semibold text-sm text-foreground-950 dark:text-foreground-950 mb-3">
                Yardım
              </h4>
              <ul className="flex flex-col gap-2">
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
                    Gizlilik
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-heading font-semibold text-sm text-foreground-950 dark:text-foreground-950 mb-3">
                Hukuki
              </h4>
              <ul className="flex flex-col gap-2">
                <li>
                  <Link to="/kullanim-kosullari" className="text-sm text-foreground-600 hover:text-primary-600 transition-colors">
                    Kullanım Kosulları
                  </Link>
                </li>
                <li>
                  <Link to="/mesafeli-satis" className="text-sm text-foreground-600 hover:text-primary-600 transition-colors">
                    Mesafeli Satış
                  </Link>
                </li>
                <li>
                  <Link to="/iade-iptal" className="text-sm text-foreground-600 hover:text-primary-600 transition-colors">
                    İade / İptal
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-background-200 dark:border-background-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-foreground-500 dark:text-foreground-500">
              &copy; {new Date().getFullYear()} İzmir İş İlanları 35. Tüm hakları saklıdır.
            </p>
            <p className="text-xs text-foreground-500 dark:text-foreground-500">
              İzmir merkezli - Tüm Türkiye'ye hizmet veriyoruz.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* TypeScript arayüzü */
interface SektorPageParams {
  slug: string;
}