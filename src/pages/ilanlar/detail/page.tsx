import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import JobImage from '@/components/feature/JobImage';
import { ASSETS } from '@/lib/assets';
import { EXPERIENCE_LABELS, formatSalary } from '@/lib/jobLabels';
import { checkRateLimit } from '@/lib/rateLimit';

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
  requirements: string[];
  benefits: string[];
  image_url: string | null;
  featured: boolean;
  created_at: string;
  expires_at: string;
  employer_id?: string | null;
}

interface SimilarJob {
  id: string;
  title: string;
  company_name: string;
  city: string;
  sector: string;
  job_type: string;
  salary_min: number | null;
  salary_max: number | null;
  created_at: string;
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Application state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyMsg, setApplyMsg] = useState('');
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  // Favorite state
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [togglingFav, setTogglingFav] = useState(false);
  const [favMsg, setFavMsg] = useState('');

  // Similar jobs state
  const [similarJobs, setSimilarJobs] = useState<SimilarJob[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api<Job>(`/api/jobs/${id}`);
        setJob(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'İlan yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchJob();
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;

    const checkApplication = async () => {
      try {
        const apps = await api<{ job_id: string }[]>('/api/applications/mine');
        if (apps.some((a) => a.job_id === id)) setAlreadyApplied(true);
      } catch {
        /* ignore */
      }
    };

    const checkFavorite = async () => {
      try {
        const favs = await api<{ id: string; job_id: string }[]>('/api/favorites');
        const found = favs.find((f) => f.job_id === id);
        if (found) {
          setIsFavorited(true);
          setFavoriteId(found.id);
        }
      } catch {
        /* ignore */
      }
    };

    checkApplication();
    checkFavorite();
  }, [user, id]);

  // Fetch similar jobs
  useEffect(() => {
    if (!job || !id) return;
    const fetchSimilar = async () => {
      setSimilarLoading(true);
      try {
        const all = await api<SimilarJob[]>(`/api/jobs?status=active&limit=50`, { auth: false });
        const others = all.filter((j) => j.id !== id);
        const bySector = others.filter((j) => j.sector === job.sector);
        const byCity = others.filter((j) => j.city === job.city);
        const seen = new Set<string>();
        const combined: SimilarJob[] = [];
        for (const j of [...bySector, ...byCity, ...others]) {
          if (seen.has(j.id)) continue;
          seen.add(j.id);
          combined.push(j);
          if (combined.length >= 6) break;
        }
        setSimilarJobs(combined);
      } catch {
        // silent
      } finally {
        setSimilarLoading(false);
      }
    };
    fetchSimilar();
  }, [job, id]);

  const handleApply = async () => {
    if (!user || !id) return;
    const rl = checkRateLimit(`apply_${user.id}_${id}`, 3, 60 * 60 * 1000);
    if (!rl.ok) {
      setApplyMsg(`Çok fazla başvuru denemesi. ${rl.retryAfterSec} sn bekleyin.`);
      return;
    }
    setApplying(true);
    setApplyMsg('');

    try {
      await api('/api/applications', {
        body: {
          job_id: id,
          cover_letter: coverLetter || null,
          cv_url: profile?.cv_url || null,
        },
      });

      setApplyMsg('Başvurunuz başarıyla alındı!');
      setAlreadyApplied(true);
      setTimeout(() => setShowApplyModal(false), 1500);
    } catch (err) {
      setApplyMsg(err instanceof Error ? err.message : 'Başvuru sırasında hata oluştu');
    } finally {
      setApplying(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user || !id) return;
    setTogglingFav(true);

    try {
      if (isFavorited && favoriteId) {
        await api(`/api/favorites/${favoriteId}`, { method: 'DELETE' });
        setIsFavorited(false);
        setFavoriteId(null);
      } else {
        const data = await api<{ id: string }>('/api/favorites', { body: { job_id: id } });
        setIsFavorited(true);
        setFavoriteId(data.id);
      }
    } catch (err) {
      setFavMsg(err instanceof Error ? err.message : 'Favori işlemi başarısız');
      setTimeout(() => setFavMsg(''), 3000);
    } finally {
      setTogglingFav(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="animate-pulse text-sm text-foreground-500">Yükleniyor...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="font-heading font-bold text-2xl text-foreground-700 mb-2">İlan Bulunamadı</h1>
            <p className="text-sm text-foreground-500 mb-4">{error || 'Aradığınız ilan mevcut değil veya kaldırılmış.'}</p>
            <Link to="/ilanlar" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Tüm İlanlara Dön
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const jobTypeLabels: Record<string, string> = {
    'tam-zamanli': 'Tam Zamanlı',
    'yari-zamanli': 'Yarı Zamanlı',
    'uzaktan': 'Uzaktan',
    'staj': 'Staj',
    'freelance': 'Freelance',
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 md:pt-24 pb-12">
        <div className="px-4 md:px-6 lg:px-8 max-w-4xl mx-auto">
          {favMsg && (
            <div className="mb-3 px-3 py-2 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
              {favMsg}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-foreground-500 mb-4">
            <Link to="/" className="hover:text-primary-600 transition-colors">Ana Sayfa</Link>
            <i className="ri-arrow-right-s-line" />
            <Link to="/ilanlar" className="hover:text-primary-600 transition-colors">İlanlar</Link>
            <i className="ri-arrow-right-s-line" />
            <span className="text-foreground-700 truncate">{job.title}</span>
          </div>

          <div className="bg-background-50 dark:bg-background-100 rounded-2xl border border-background-200 dark:border-background-200 overflow-hidden mb-6">
            <div className="h-40 md:h-56 w-full">
              <JobImage
                src={job.image_url}
                alt={job.title}
                placeholder={ASSETS.jobDetailPlaceholder}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5 md:p-8">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                  {jobTypeLabels[job.job_type] || job.job_type}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300">
                  {job.sector}
                </span>
                {job.featured && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-300">
                    Öne Çıkan
                  </span>
                )}
              </div>

              <h1 className="font-heading font-bold text-xl md:text-2xl lg:text-3xl text-foreground-950 dark:text-foreground-950 mb-2">
                {job.title}
              </h1>
              <p className="text-base text-foreground-700 mb-4">{job.company_name}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-foreground-600">
                <span className="flex items-center gap-1.5">
                  <i className="ri-map-pin-line text-primary-500" />
                  {job.city}
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="ri-briefcase-line text-primary-500" />
                  {EXPERIENCE_LABELS[job.experience_level] || job.experience_level || 'Belirtilmedi'}
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="ri-coins-line text-primary-500" />
                  {formatSalary(job.salary_min, job.salary_max)}
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="ri-time-line text-primary-500" />
                  {new Date(job.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-background-50 dark:bg-background-100 rounded-xl border border-background-200 dark:border-background-200 p-5 md:p-6">
                <h2 className="font-heading font-semibold text-lg text-foreground-950 mb-4">İlan Açıklaması</h2>
                <p className="text-sm text-foreground-700 leading-relaxed">{job.description}</p>
              </div>

              {job.requirements && job.requirements.length > 0 && (
                <div className="bg-background-50 dark:bg-background-100 rounded-xl border border-background-200 dark:border-background-200 p-5 md:p-6">
                  <h2 className="font-heading font-semibold text-lg text-foreground-950 mb-4">Gereksinimler</h2>
                  <ul className="space-y-2">
                    {job.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-foreground-700">
                        <i className="ri-checkbox-circle-line text-accent-500 mt-0.5 shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {job.benefits && job.benefits.length > 0 && (
                <div className="bg-background-50 dark:bg-background-100 rounded-xl border border-background-200 dark:border-background-200 p-5 md:p-6">
                  <h2 className="font-heading font-semibold text-lg text-foreground-950 mb-4">Yan Haklar</h2>
                  <ul className="space-y-2">
                    {job.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-foreground-700">
                        <i className="ri-gift-line text-primary-500 mt-0.5 shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-background-50 dark:bg-background-100 rounded-xl border border-background-200 dark:border-background-200 p-5">
                {user && profile?.role === 'candidate' && !alreadyApplied ? (
                  <button
                    onClick={() => setShowApplyModal(true)}
                    className="w-full py-3 bg-primary-500 text-white font-medium text-sm rounded-lg hover:bg-primary-600 transition-colors mb-3 whitespace-nowrap"
                  >
                    <i className="ri-send-plane-line mr-1.5" />
                    Hemen Başvur
                  </button>
                ) : user && (alreadyApplied || profile?.role === 'employer') ? (
                  <button
                    disabled
                    className="w-full py-3 bg-background-100 dark:bg-background-50 border border-background-200 text-foreground-500 font-medium text-sm rounded-lg mb-3 whitespace-nowrap cursor-not-allowed"
                  >
                    {alreadyApplied ? 'Başvuru Yapıldı' : 'İşveren hesabıyla başvurulamaz'}
                  </button>
                ) : (
                  <Link
                    to="/giris"
                    className="w-full py-3 bg-primary-500 text-white font-medium text-sm rounded-lg hover:bg-primary-600 transition-colors mb-3 whitespace-nowrap flex items-center justify-center"
                  >
                    <i className="ri-send-plane-line mr-1.5" />
                    Başvurmak İçin Giriş Yap
                  </Link>
                )}

                {profile?.role === 'candidate' && (
                  <button
                    onClick={handleToggleFavorite}
                    disabled={togglingFav}
                    className={`w-full py-3 border font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${
                      isFavorited
                        ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                        : 'bg-background-100 dark:bg-background-50 border-background-200 dark:border-background-200 text-foreground-700 hover:bg-background-200'
                    }`}
                  >
                    <i className={`${isFavorited ? 'ri-heart-fill' : 'ri-heart-line'}`} />
                    {isFavorited ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                  </button>
                )}
              </div>

              <div className="bg-background-50 dark:bg-background-100 rounded-xl border border-background-200 dark:border-background-200 p-5">
                <h3 className="font-heading font-semibold text-sm text-foreground-950 mb-3">İlan Bilgileri</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-foreground-500">Yayınlanma</span>
                    <span className="text-foreground-700">{new Date(job.created_at).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-500">Bitiş Tarihi</span>
                    <span className="text-foreground-700">{new Date(job.expires_at).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-500">Sektör</span>
                    <span className="text-foreground-700">{job.sector}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-500">Çalışma Tipi</span>
                    <span className="text-foreground-700">{jobTypeLabels[job.job_type] || job.job_type}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Jobs Section */}
        {similarJobs.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-heading font-bold text-lg md:text-xl text-foreground-950">Benzer İlanlar</h2>
                <p className="text-xs text-foreground-500 mt-0.5">İlgini çekebilecek diğer ilanlar</p>
              </div>
              <Link to="/ilanlar" className="text-sm text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap flex items-center gap-1">
                Tümünü Gör <i className="ri-arrow-right-line" />
              </Link>
            </div>

            {similarLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-background-50 dark:bg-background-100 rounded-xl border border-background-200 p-5 animate-pulse">
                    <div className="h-4 w-3/4 bg-background-200 rounded mb-3" />
                    <div className="h-3 w-1/2 bg-background-200 rounded mb-4" />
                    <div className="h-3 w-full bg-background-200 rounded mb-2" />
                    <div className="h-3 w-2/3 bg-background-200 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {similarJobs.map((sJob) => (
                  <Link
                    key={sJob.id}
                    to={`/ilan/${sJob.id}`}
                    className="bg-background-50 dark:bg-background-100 rounded-xl border border-background-200 hover:border-primary-300 dark:hover:border-primary-600 p-5 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300">
                        {sJob.sector}
                      </span>
                      <span className="text-xs text-foreground-400">
                        {new Date(sJob.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <h3 className="font-heading font-semibold text-sm text-foreground-950 mb-1.5 group-hover:text-primary-600 transition-colors line-clamp-1">
                      {sJob.title}
                    </h3>
                    <p className="text-xs text-foreground-500 mb-3">{sJob.company_name}</p>
                    <div className="flex items-center gap-3 text-xs text-foreground-600 mb-3">
                      <span className="flex items-center gap-1">
                        <i className="ri-map-pin-line text-foreground-400" />
                        {sJob.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="ri-briefcase-line text-foreground-400" />
                        {jobTypeLabels[sJob.job_type] || sJob.job_type}
                      </span>
                    </div>
                    {sJob.salary_min && sJob.salary_max && (
                      <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                        {sJob.salary_min.toLocaleString('tr-TR')} - {sJob.salary_max.toLocaleString('tr-TR')} TL
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setShowApplyModal(false)}>
          <div
            className="bg-background-50 dark:bg-background-100 rounded-2xl border border-background-200 dark:border-background-200 w-full max-w-lg p-5 md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-lg text-foreground-950">Başvuru Yap</h3>
              <button
                onClick={() => setShowApplyModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-background-200 transition-colors"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-background-100 dark:bg-background-50 rounded-lg border border-background-200">
              <p className="text-sm font-medium text-foreground-950">{job.title}</p>
              <p className="text-xs text-foreground-500">{job.company_name} · {job.city}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground-700 mb-1.5">Ön Yazı (İsteğe Bağlı)</label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={4}
                maxLength={500}
                className="w-full px-3 py-2 rounded-lg bg-background-100 dark:bg-background-50 border border-background-200 text-sm text-foreground-950 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
                placeholder="Kendinizi kısaca tanıtın..."
              />
              <p className="text-xs text-foreground-400 mt-1">{coverLetter.length}/500 karakter</p>
            </div>

            {applyMsg && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${applyMsg.includes('başarıyla') ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'}`}>
                {applyMsg}
              </div>
            )}

            <button
              onClick={handleApply}
              disabled={applying}
              className="w-full py-2.5 bg-primary-500 text-white font-medium text-sm rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {applying ? 'Başvuru Gönderiliyor...' : 'Başvuruyu Gönder'}
            </button>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}