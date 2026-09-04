import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { api } from '@/lib/api';
import JobImage from '@/components/feature/JobImage';

interface Job {
  id: string;
  title: string;
  company_name: string;
  city: string;
  sector: string;
  job_type: string;
  experience_level: string;
  salary_min: number | null;
  salary_max: number | null;
  description: string;
  image_url: string | null;
  created_at: string;
}

type SortOption = 'newest' | 'oldest' | 'salary-asc' | 'salary-desc';
type PostedWithin = '' | '24h' | '7d' | '30d';

const EXPERIENCE_LEVELS = [
  { value: '', label: 'Tüm Seviyeler' },
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid-Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'her-seviye', label: 'Her Seviye' },
];

const JOB_TYPES: Record<string, string> = {
  'tam-zamanli': 'Tam Zamanlı',
  'yari-zamanli': 'Yarı Zamanlı',
  'uzaktan': 'Uzaktan',
  'staj': 'Staj',
  'freelance': 'Freelance',
};

const JOB_TYPE_COLORS: Record<string, string> = {
  'tam-zamanli': 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
  'yari-zamanli': 'bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300',
  'uzaktan': 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-300',
  'staj': 'bg-background-200 text-foreground-700 dark:bg-background-200 dark:text-foreground-600',
  'freelance': 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
};

const EXPERIENCE_COLORS: Record<string, string> = {
  'junior': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'mid': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  'senior': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  'her-seviye': 'bg-foreground-100 text-foreground-600',
};

const SORT_OPTIONS: { value: SortOption; label: string; icon: string }[] = [
  { value: 'newest', label: 'En Yeni', icon: 'ri-arrow-down-line' },
  { value: 'oldest', label: 'En Eski', icon: 'ri-arrow-up-line' },
  { value: 'salary-desc', label: 'Maaş (Yüksek-Düşük)', icon: 'ri-arrow-down-line' },
  { value: 'salary-asc', label: 'Maaş (Düşük-Yüksek)', icon: 'ri-arrow-up-line' },
];

const POSTED_OPTIONS: { value: PostedWithin; label: string }[] = [
  { value: '', label: 'Tüm Zamanlar' },
  { value: '24h', label: 'Son 24 Saat' },
  { value: '7d', label: 'Son 7 Gün' },
  { value: '30d', label: 'Son 30 Gün' },
];

export default function JobListingsPage() {
  const [searchParams] = useSearchParams();

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || '');
  const [selectedSector, setSelectedSector] = useState(searchParams.get('sector') || '');
  const [selectedType, setSelectedType] = useState('');
  const [selectedExperience, setSelectedExperience] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [postedWithin, setPostedWithin] = useState<PostedWithin>('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Advanced filters toggle
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Data
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ status: 'active', limit: '200' });
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedCity) params.set('city', selectedCity);
      if (selectedSector) params.set('sector', selectedSector);
      if (selectedType) params.set('job_type', selectedType);

      let list = await api<Job[]>(`/api/jobs?${params.toString()}`, { auth: false });

      if (selectedExperience) {
        list = list.filter((j) => j.experience_level === selectedExperience);
      }
      if (salaryMin) {
        const min = parseInt(salaryMin, 10);
        list = list.filter((j) => j.salary_max != null && j.salary_max >= min);
      }
      if (salaryMax) {
        const max = parseInt(salaryMax, 10);
        list = list.filter((j) => j.salary_min != null && j.salary_min <= max);
      }
      if (postedWithin) {
        const now = Date.now();
        const ms =
          postedWithin === '24h' ? 24 * 60 * 60 * 1000 :
          postedWithin === '7d' ? 7 * 24 * 60 * 60 * 1000 :
          30 * 24 * 60 * 60 * 1000;
        const since = now - ms;
        list = list.filter((j) => new Date(j.created_at).getTime() >= since);
      }

      switch (sortBy) {
        case 'oldest':
          list = [...list].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          break;
        case 'salary-asc':
          list = [...list].sort((a, b) => (a.salary_min ?? Infinity) - (b.salary_min ?? Infinity));
          break;
        case 'salary-desc':
          list = [...list].sort((a, b) => (b.salary_max ?? -Infinity) - (a.salary_max ?? -Infinity));
          break;
        default:
          list = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      setJobs(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İlanlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCity, selectedSector, selectedType, selectedExperience, salaryMin, salaryMax, postedWithin, sortBy]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const cities = useMemo(() => [...new Set(jobs.map((j) => j.city))].sort(), [jobs]);
  const sectors = useMemo(() => [...new Set(jobs.map((j) => j.sector))].sort(), [jobs]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCity) count++;
    if (selectedSector) count++;
    if (selectedType) count++;
    if (selectedExperience) count++;
    if (salaryMin || salaryMax) count++;
    if (postedWithin) count++;
    return count;
  }, [selectedCity, selectedSector, selectedType, selectedExperience, salaryMin, salaryMax, postedWithin]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCity('');
    setSelectedSector('');
    setSelectedType('');
    setSelectedExperience('');
    setSalaryMin('');
    setSalaryMax('');
    setPostedWithin('');
    setSortBy('newest');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-[var(--site-header-offset,5rem)] pb-12">
        {/* Page Header */}
        <div className="px-4 md:px-6 lg:px-8 max-w-6xl mx-auto mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="font-heading font-bold text-2xl md:text-3xl text-foreground-950 mb-1">
                İş İlanları
              </h1>
              <p className="text-sm text-foreground-500">
                {loading ? 'Yükleniyor...' : `${jobs.length} ilan bulundu`}
                {activeFilterCount > 0 && (
                  <span className="text-primary-600 dark:text-primary-400 font-medium"> · {activeFilterCount} filtre aktif</span>
                )}
              </p>
            </div>

            {/* Sort dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-foreground-500 hidden sm:inline">Sırala:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-background-200 bg-white dark:bg-background-100 text-sm text-foreground-950 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <i className="ri-arrow-down-s-line absolute right-2 top-1/2 -translate-y-1/2 text-foreground-400 pointer-events-none text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-4 md:px-6 lg:px-8 max-w-6xl mx-auto mb-6">
          <div className="bg-background-50 dark:bg-background-100 rounded-xl border border-background-200 p-3 md:p-4 space-y-3">
            {/* Main row: search + city + sector + type */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-400 text-sm" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="İş unvanı, şirket veya anahtar kelime..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background-100 dark:bg-background-50 border border-background-200 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                />
              </div>
              <div className="flex gap-2 flex-wrap md:flex-nowrap">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="flex-1 md:flex-none md:w-36 py-2.5 px-3 rounded-lg bg-background-100 dark:bg-background-50 border border-background-200 text-sm text-foreground-950 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent cursor-pointer"
                >
                  <option value="">Tüm Şehirler</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="flex-1 md:flex-none md:w-40 py-2.5 px-3 rounded-lg bg-background-100 dark:bg-background-50 border border-background-200 text-sm text-foreground-950 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent cursor-pointer"
                >
                  <option value="">Tüm Sektörler</option>
                  {sectors.map((sector) => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </select>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="flex-1 md:flex-none md:w-40 py-2.5 px-3 rounded-lg bg-background-100 dark:bg-background-50 border border-background-200 text-sm text-foreground-950 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent cursor-pointer"
                >
                  <option value="">Tüm Tipler</option>
                  {Object.entries(JOB_TYPES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Advanced filters toggle */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap"
              >
                <i className={`ri-equalizer-line ${activeFilterCount > 0 ? 'text-primary-500' : ''}`} />
                Gelişmiş Filtreler
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-bold">
                    {activeFilterCount}
                  </span>
                )}
                <i className={`text-xs transition-transform ${showAdvanced ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`} />
              </button>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors whitespace-nowrap"
                >
                  <i className="ri-close-circle-line mr-1" />
                  Tüm Filtreleri Sıfırla
                </button>
              )}
            </div>

            {/* Advanced filters panel */}
            {showAdvanced && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-background-200/70">
                {/* Experience Level */}
                <div>
                  <label className="block text-xs font-medium text-foreground-500 mb-1.5">Deneyim Seviyesi</label>
                  <select
                    value={selectedExperience}
                    onChange={(e) => setSelectedExperience(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-lg bg-background-100 dark:bg-background-50 border border-background-200 text-sm text-foreground-950 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent cursor-pointer"
                  >
                    {EXPERIENCE_LEVELS.map((exp) => (
                      <option key={exp.value} value={exp.value}>{exp.label}</option>
                    ))}
                  </select>
                </div>

                {/* Salary Range */}
                <div>
                  <label className="block text-xs font-medium text-foreground-500 mb-1.5">Maaş Aralığı (TL)</label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={salaryMin}
                        onChange={(e) => setSalaryMin(e.target.value.replace(/\D/g, ''))}
                        placeholder="Min"
                        className="w-full pl-6 pr-2 py-2 rounded-lg bg-background-100 dark:bg-background-50 border border-background-200 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                      />
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-foreground-400">₺</span>
                    </div>
                    <span className="text-xs text-foreground-400">—</span>
                    <div className="relative flex-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={salaryMax}
                        onChange={(e) => setSalaryMax(e.target.value.replace(/\D/g, ''))}
                        placeholder="Maks"
                        className="w-full pl-6 pr-2 py-2 rounded-lg bg-background-100 dark:bg-background-50 border border-background-200 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                      />
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-foreground-400">₺</span>
                    </div>
                  </div>
                </div>

                {/* Posted Within */}
                <div>
                  <label className="block text-xs font-medium text-foreground-500 mb-1.5">Yayınlanma Zamanı</label>
                  <select
                    value={postedWithin}
                    onChange={(e) => setPostedWithin(e.target.value as PostedWithin)}
                    className="w-full py-2.5 px-3 rounded-lg bg-background-100 dark:bg-background-50 border border-background-200 text-sm text-foreground-950 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent cursor-pointer"
                  >
                    {POSTED_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Quick shortcuts */}
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full py-2.5 px-3 rounded-lg bg-background-100 dark:bg-background-50 border border-background-200 text-sm text-foreground-600 hover:text-foreground-800 hover:border-background-300 transition-colors whitespace-nowrap"
                  >
                    <i className="ri-refresh-line mr-1" />
                    Sıfırla
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Job List */}
        <div className="px-4 md:px-6 lg:px-8 max-w-6xl mx-auto">
          {loading && (
            <div className="flex flex-col gap-3 md:gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-background-50 rounded-xl border border-background-200 h-28 animate-pulse" />
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-16">
              <div className="w-14 h-14 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <i className="ri-error-warning-line text-xl text-red-600 dark:text-red-400" />
              </div>
              <p className="text-sm text-foreground-500 mb-3">{error}</p>
              <button
                onClick={fetchJobs}
                className="px-5 py-2.5 text-sm font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors whitespace-nowrap"
              >
                <i className="ri-refresh-line mr-1.5" />Yeniden Dene
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {jobs.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto rounded-full bg-background-100 dark:bg-background-200 flex items-center justify-center mb-4">
                    <i className="ri-search-line text-2xl text-foreground-400" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg text-foreground-700 mb-2">
                    Sonuç bulunamadı
                  </h3>
                  <p className="text-sm text-foreground-500 mb-4">
                    Farklı arama kriterleri deneyin veya filtreleri sıfırlayın.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="px-5 py-2.5 text-sm font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors whitespace-nowrap"
                  >
                    <i className="ri-refresh-line mr-1.5" />Filtreleri Sıfırla
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 md:gap-4">
                  {jobs.map((job) => (
                    <Link
                      key={job.id}
                      to={`/ilan/${job.id}`}
                      className="group bg-background-50 dark:bg-background-100 rounded-xl border border-background-200 p-4 md:p-5 hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-300 hover:-translate-y-0.5"
                    >
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Image */}
                        <div className="w-full sm:w-24 md:w-28 h-24 sm:h-20 md:h-24 shrink-0 rounded-lg overflow-hidden">
                          <JobImage
                            src={job.image_url}
                            alt={job.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <h3 className="font-heading font-semibold text-base md:text-lg text-foreground-950 group-hover:text-primary-600 transition-colors line-clamp-1">
                              {job.title}
                            </h3>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${JOB_TYPE_COLORS[job.job_type] || JOB_TYPE_COLORS['tam-zamanli']}`}>
                                {JOB_TYPES[job.job_type] || job.job_type}
                              </span>
                            </div>
                          </div>

                          <p className="text-sm text-foreground-600 mb-2">{job.company_name}</p>

                          <div className="flex items-center gap-3 text-xs text-foreground-500 flex-wrap mb-2">
                            <span className="flex items-center gap-1">
                              <i className="ri-map-pin-line text-foreground-400" />
                              {job.city}
                            </span>
                            <span className="flex items-center gap-1">
                              <i className="ri-briefcase-line text-foreground-400" />
                              {job.sector}
                            </span>
                            {job.experience_level && (
                              <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${EXPERIENCE_COLORS[job.experience_level] || EXPERIENCE_COLORS['her-seviye']}`}>
                                {job.experience_level === 'her-seviye' ? 'Her Seviye' :
                                 job.experience_level === 'junior' ? 'Junior' :
                                 job.experience_level === 'mid' ? 'Mid' : 'Senior'}
                              </span>
                            )}
                            {job.salary_min && job.salary_max && (
                              <span className="flex items-center gap-1 font-medium text-foreground-700">
                                <i className="ri-coins-line text-foreground-400" />
                                {job.salary_min.toLocaleString('tr-TR')} - {job.salary_max.toLocaleString('tr-TR')} TL
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-foreground-400">
                            <span className="flex items-center gap-1">
                              <i className="ri-time-line" />
                              {new Date(job.created_at).toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}