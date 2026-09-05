import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import JobImage from '@/components/feature/JobImage';
import { jobPath } from '@/lib/jobPath';

interface Job {
  id: string;
  slug?: string | null;
  title: string;
  company_name: string;
  city: string;
  job_type: string;
  experience_level: string;
  salary_min: number | null;
  salary_max: number | null;
  image_url: string | null;
  featured: boolean;
  created_at: string;
}

export default function FeaturedJobsSection() {
  const { t } = useTranslation('common');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await api<Job[]>('/api/jobs?status=active&featured=true&limit=4', { auth: false });
        setJobs(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'İlanlar yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const jobTypeLabels: Record<string, string> = {
    'tam-zamanli': t('featuredJobs.fullTime'),
    'yari-zamanli': t('featuredJobs.partTime'),
    'uzaktan': t('featuredJobs.remote'),
    'staj': t('featuredJobs.internship'),
    'sozlesmeli': t('featuredJobs.contract'),
  };

  const jobTypeColors: Record<string, string> = {
    'tam-zamanli': 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
    'yari-zamanli': 'bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300',
    'uzaktan': 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-300',
    'staj': 'bg-background-200 text-foreground-700 dark:bg-background-200 dark:text-foreground-600',
    'sozlesmeli': 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
  };

  return (
    <section className="py-14 md:py-20 bg-background-100 dark:bg-background-100">
      <div className="px-4 md:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-10 md:mb-14">
          <div>
            <h2 className="font-heading font-bold text-2xl md:text-3xl lg:text-4xl text-foreground-950 dark:text-foreground-950 mb-3">
              {t('featuredJobs.title')}
            </h2>
            <p className="text-sm md:text-base text-foreground-600 max-w-lg">
              {t('featuredJobs.subtitle')}
            </p>
          </div>
          <Link
            to="/ilanlar"
            className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 whitespace-nowrap"
          >
            {t('featuredJobs.viewAll')}
            <i className="ri-arrow-right-line" />
          </Link>
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-background-50 rounded-xl border border-background-200 h-40 animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-sm text-foreground-500 mb-3">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              Yeniden Dene
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="group bg-background-50 dark:bg-background-50 rounded-xl border border-background-200 dark:border-background-200 overflow-hidden hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-40 md:w-48 h-40 sm:h-auto shrink-0">
                    <JobImage
                      src={job.image_url}
                      alt={job.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 p-4 md:p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${jobTypeColors[job.job_type] || jobTypeColors['tam-zamanli']}`}>
                          {jobTypeLabels[job.job_type] || job.job_type}
                        </span>
                        {job.featured && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300">
                            Öne Çıkan
                          </span>
                        )}
                      </div>
                      <h3 className="font-heading font-semibold text-base md:text-lg text-foreground-950 dark:text-foreground-950 mb-1 line-clamp-1">
                        {job.title}
                      </h3>
                      <p className="text-sm text-foreground-600 mb-2">
                        {job.company_name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-foreground-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <i className="ri-map-pin-line" />
                          {job.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <i className="ri-briefcase-line" />
                          {job.experience_level}
                        </span>
                        {job.salary_min && job.salary_max && (
                          <span className="flex items-center gap-1">
                            <i className="ri-coins-line" />
                            {job.salary_min.toLocaleString('tr-TR')} - {job.salary_max.toLocaleString('tr-TR')} TL
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-foreground-400">
                        {new Date(job.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                      </span>
                      <Link
                        to={jobPath(job)}
                        className="px-3 py-1.5 text-xs font-medium bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors whitespace-nowrap"
                      >
                        {t('featuredJobs.applyNow')}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}