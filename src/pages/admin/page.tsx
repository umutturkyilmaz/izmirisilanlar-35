import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import DashboardSection from '@/pages/admin/components/DashboardSection';
import PaymentsSection from '@/pages/admin/components/PaymentsSection';

interface EmployerProfile {
  id: string;
  role: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  city: string | null;
  vergi_numarasi: string | null;
  dogrulama_durumu: 'unverified' | 'pending' | 'verified' | 'rejected';
  dogrulama_talebi_tarihi: string | null;
  dogrulanma_tarihi: string | null;
  created_at: string;
}

interface JobWithEmployer {
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
  status: 'pending' | 'active' | 'rejected' | 'closed' | 'expired';
  employer_id: string | null;
  created_at: string;
  employer_full_name: string | null;
  employer_vergi: string | null;
}

type EmployerFilterTab = 'all' | 'pending' | 'verified' | 'rejected' | 'unverified';
type JobFilterTab = 'all' | 'pending' | 'active' | 'rejected';
type MainTab = 'employers' | 'jobs' | 'payments' | 'stats';

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth();

  // Main tab
  const [mainTab, setMainTab] = useState<MainTab>('employers');

  // Employer state
  const [employers, setEmployers] = useState<EmployerProfile[]>([]);
  const [empLoading, setEmpLoading] = useState(true);
  const [empError, setEmpError] = useState<string | null>(null);
  const [empActiveTab, setEmpActiveTab] = useState<EmployerFilterTab>('all');
  const [empSearch, setEmpSearch] = useState('');
  const [empActionLoading, setEmpActionLoading] = useState<string | null>(null);
  const [empActionMsg, setEmpActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [empDetailModal, setEmpDetailModal] = useState<EmployerProfile | null>(null);

  // Job state
  const [jobs, setJobs] = useState<JobWithEmployer[]>([]);
  const [jobLoading, setJobLoading] = useState(true);
  const [jobError, setJobError] = useState<string | null>(null);
  const [jobActiveTab, setJobActiveTab] = useState<JobFilterTab>('all');
  const [jobSearch, setJobSearch] = useState('');
  const [jobActionLoading, setJobActionLoading] = useState<string | null>(null);
  const [jobActionMsg, setJobActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [jobDetailModal, setJobDetailModal] = useState<JobWithEmployer | null>(null);

  const fetchEmployers = useCallback(async () => {
    try {
      setEmpLoading(true);
      setEmpError(null);
      const data = await api<EmployerProfile[]>('/api/admin/users');
      setEmployers((data || []).filter((u) => u.role === 'employer'));
    } catch (err) {
      setEmpError(err instanceof Error ? err.message : 'Veriler yüklenemedi');
    } finally {
      setEmpLoading(false);
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      setJobLoading(true);
      setJobError(null);
      const [jobsData, users] = await Promise.all([
        api<any[]>('/api/jobs?limit=200'),
        api<{ id: string; full_name: string | null; vergi_numarasi: string | null }[]>('/api/admin/users'),
      ]);

      const profilesMap: Record<string, { full_name: string | null; vergi_numarasi: string | null }> = {};
      (users || []).forEach((p) => {
        profilesMap[p.id] = p;
      });

      const enriched: JobWithEmployer[] = (jobsData || []).map((j: any) => ({
        ...j,
        employer_full_name: profilesMap[j.employer_id]?.full_name || null,
        employer_vergi: profilesMap[j.employer_id]?.vergi_numarasi || null,
      }));

      setJobs(enriched);
    } catch (err) {
      setJobError(err instanceof Error ? err.message : 'İlanlar yüklenemedi');
    } finally {
      setJobLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && profile?.role === 'admin') {
      fetchEmployers();
      fetchJobs();
    }
  }, [authLoading, profile, fetchEmployers, fetchJobs]);

  // Employer actions
  const handleApproveEmployer = async (employerId: string) => {
    setEmpActionLoading(employerId);
    setEmpActionMsg(null);
    try {
      await api(`/api/admin/users/${employerId}`, {
        method: 'PATCH',
        body: { dogrulama_durumu: 'verified' },
      });
      setEmpActionMsg({ type: 'success', text: 'İşveren başarıyla onaylandı.' });
      await fetchEmployers();
    } catch (err) {
      setEmpActionMsg({ type: 'error', text: err instanceof Error ? err.message : 'Onaylama başarısız oldu.' });
    } finally {
      setEmpActionLoading(null);
    }
  };

  const handleRejectEmployer = async (employerId: string) => {
    setEmpActionLoading(employerId);
    setEmpActionMsg(null);
    try {
      await api(`/api/admin/users/${employerId}`, {
        method: 'PATCH',
        body: { dogrulama_durumu: 'rejected' },
      });
      setEmpActionMsg({ type: 'success', text: 'İşveren başvurusu reddedildi.' });
      await fetchEmployers();
    } catch (err) {
      setEmpActionMsg({ type: 'error', text: err instanceof Error ? err.message : 'Reddetme başarısız oldu.' });
    } finally {
      setEmpActionLoading(null);
    }
  };

  // Job actions
  const handleApproveJob = async (jobId: string) => {
    setJobActionLoading(jobId);
    setJobActionMsg(null);
    try {
      await api(`/api/jobs/${jobId}`, { method: 'PATCH', body: { status: 'active' } });
      setJobActionMsg({ type: 'success', text: 'İlan başarıyla onaylandı ve yayına alındı.' });
      await fetchJobs();
    } catch (err) {
      setJobActionMsg({ type: 'error', text: err instanceof Error ? err.message : 'İlan onaylama başarısız oldu.' });
    } finally {
      setJobActionLoading(null);
    }
  };

  const handleRejectJob = async (jobId: string) => {
    setJobActionLoading(jobId);
    setJobActionMsg(null);
    try {
      await api(`/api/jobs/${jobId}`, { method: 'PATCH', body: { status: 'rejected' } });
      setJobActionMsg({ type: 'success', text: 'İlan reddedildi.' });
      await fetchJobs();
    } catch (err) {
      setJobActionMsg({ type: 'error', text: err instanceof Error ? err.message : 'İlan reddetme başarısız oldu.' });
    } finally {
      setJobActionLoading(null);
    }
  };

  const handleCloseJob = async (jobId: string) => {
    setJobActionLoading(jobId);
    setJobActionMsg(null);
    try {
      await api(`/api/jobs/${jobId}`, { method: 'PATCH', body: { status: 'closed' } });
      setJobActionMsg({ type: 'success', text: 'İlan kapatıldı.' });
      await fetchJobs();
    } catch (err) {
      setJobActionMsg({ type: 'error', text: err instanceof Error ? err.message : 'İlan kapatma başarısız oldu.' });
    } finally {
      setJobActionLoading(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const formatShortDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Employer filters
  const filterEmployers = () => {
    let filtered = employers;
    if (empActiveTab !== 'all') {
      filtered = filtered.filter((e) => e.dogrulama_durumu === empActiveTab);
    }
    if (empSearch.trim()) {
      const term = empSearch.toLowerCase().trim();
      filtered = filtered.filter(
        (e) =>
          (e.company_name && e.company_name.toLowerCase().includes(term)) ||
          (e.full_name && e.full_name.toLowerCase().includes(term)) ||
          (e.vergi_numarasi && e.vergi_numarasi.includes(term)) ||
          (e.city && e.city.toLowerCase().includes(term)),
      );
    }
    return filtered;
  };

  // Job filters
  const filterJobs = () => {
    let filtered = jobs;
    if (jobActiveTab !== 'all') {
      filtered = filtered.filter((j) => j.status === jobActiveTab);
    }
    if (jobSearch.trim()) {
      const term = jobSearch.toLowerCase().trim();
      filtered = filtered.filter(
        (j) =>
          j.title.toLowerCase().includes(term) ||
          j.company_name.toLowerCase().includes(term) ||
          (j.city && j.city.toLowerCase().includes(term)) ||
          (j.sector && j.sector.toLowerCase().includes(term)),
      );
    }
    return filtered;
  };

  // Employer stats
  const empStats = {
    total: employers.length,
    pending: employers.filter((e) => e.dogrulama_durumu === 'pending').length,
    verified: employers.filter((e) => e.dogrulama_durumu === 'verified').length,
    rejected: employers.filter((e) => e.dogrulama_durumu === 'rejected').length,
    unverified: employers.filter((e) => e.dogrulama_durumu === 'unverified').length,
  };

  // Job stats
  const jobStats = {
    total: jobs.length,
    pending: jobs.filter((j) => j.status === 'pending').length,
    active: jobs.filter((j) => j.status === 'active').length,
    rejected: jobs.filter((j) => j.status === 'rejected').length,
    closed: jobs.filter((j) => j.status === 'closed').length,
    expired: jobs.filter((j) => j.status === 'expired').length,
  };

  const empStatusLabel: Record<string, string> = {
    unverified: 'Doğrulanmamış',
    pending: 'Beklemede',
    verified: 'Doğrulanmış',
    rejected: 'Reddedildi',
  };

  const empStatusStyle: Record<string, string> = {
    unverified: 'bg-foreground-100 text-foreground-600',
    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    verified: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    rejected: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  };

  const jobStatusLabel: Record<string, string> = {
    pending: 'Onay Bekliyor',
    active: 'Yayında',
    rejected: 'Reddedildi',
    closed: 'Kapatıldı',
    expired: 'Süresi Doldu',
  };

  const jobStatusStyle: Record<string, string> = {
    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    rejected: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    closed: 'bg-foreground-100 text-foreground-600',
    expired: 'bg-foreground-100 text-foreground-500',
  };

  const jobTypeLabels: Record<string, string> = {
    'tam-zamanli': 'Tam Zamanlı',
    'yari-zamanli': 'Yarı Zamanlı',
    'uzaktan': 'Uzaktan',
    'staj': 'Staj',
    'freelance': 'Freelance',
  };

  const experienceLabels: Record<string, string> = {
    'junior': 'Junior',
    'mid': 'Mid-Level',
    'senior': 'Senior',
    'her-seviye': 'Her Seviye',
  };

  const employerTabs: { key: EmployerFilterTab; label: string; count: number; icon: string }[] = [
    { key: 'all', label: 'Tümü', count: empStats.total, icon: 'ri-group-line' },
    { key: 'pending', label: 'Bekleyen', count: empStats.pending, icon: 'ri-time-line' },
    { key: 'verified', label: 'Onaylı', count: empStats.verified, icon: 'ri-verified-badge-line' },
    { key: 'rejected', label: 'Reddedilen', count: empStats.rejected, icon: 'ri-close-circle-line' },
    { key: 'unverified', label: 'Doğrulanmamış', count: empStats.unverified, icon: 'ri-shield-cross-line' },
  ];

  const jobTabs: { key: JobFilterTab; label: string; count: number; icon: string }[] = [
    { key: 'all', label: 'Tümü', count: jobStats.total, icon: 'ri-file-list-line' },
    { key: 'pending', label: 'Onay Bekleyen', count: jobStats.pending, icon: 'ri-time-line' },
    { key: 'active', label: 'Yayında', count: jobStats.active, icon: 'ri-check-double-line' },
    { key: 'rejected', label: 'Reddedilen', count: jobStats.rejected, icon: 'ri-close-circle-line' },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-sm text-foreground-500">Yükleniyor...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || !profile || profile.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 pt-20 md:pt-24 pb-12">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
              <i className="ri-shield-cross-line text-2xl text-red-600 dark:text-red-400" />
            </div>
            <h1 className="font-heading font-bold text-xl text-foreground-950 mb-2">Erişim Reddedildi</h1>
            <p className="text-sm text-foreground-600 mb-5">
              Bu sayfaya yalnızca admin yetkisine sahip kullanıcılar erişebilir.
            </p>
            <Link to="/" className="px-6 py-2.5 bg-primary-500 text-white font-medium text-sm rounded-lg hover:bg-primary-600 transition-colors whitespace-nowrap">
              Ana Sayfaya Dön
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background-50">
      <Navbar />
      <main className="flex-1 pt-20 md:pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <i className="ri-admin-line text-lg text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-2xl text-foreground-950">Admin Paneli</h1>
                <p className="text-sm text-foreground-500">İşveren doğrulama ve ilan onaylama yönetimi</p>
              </div>
            </div>
          </div>

          {/* Main Tab Switcher */}
          <div className="mb-6 inline-flex p-1 bg-background-100 dark:bg-background-200 rounded-full">
            <button
              onClick={() => setMainTab('employers')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                mainTab === 'employers'
                  ? 'bg-white dark:bg-background-50 text-foreground-950 shadow-sm'
                  : 'text-foreground-500 hover:text-foreground-700'
              }`}
            >
              <i className="ri-building-line mr-1.5" />
              İşveren Doğrulama
            </button>
            <button
              onClick={() => setMainTab('jobs')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                mainTab === 'jobs'
                  ? 'bg-white dark:bg-background-50 text-foreground-950 shadow-sm'
                  : 'text-foreground-500 hover:text-foreground-700'
              }`}
            >
              <i className="ri-briefcase-line mr-1.5" />
              İlan Onaylama
              {jobStats.pending > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                  {jobStats.pending}
                </span>
              )}
            </button>
            <button
              onClick={() => setMainTab('payments')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                mainTab === 'payments'
                  ? 'bg-white dark:bg-background-50 text-foreground-950 shadow-sm'
                  : 'text-foreground-500 hover:text-foreground-700'
              }`}
            >
              <i className="ri-bank-card-line mr-1.5" />
              Ödemeler
            </button>
            <button
              onClick={() => setMainTab('stats')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                mainTab === 'stats'
                  ? 'bg-white dark:bg-background-50 text-foreground-950 shadow-sm'
                  : 'text-foreground-500 hover:text-foreground-700'
              }`}
            >
              <i className="ri-bar-chart-line mr-1.5" />
              İstatistikler
            </button>
          </div>

          {/* ==================== EMPLOYERS TAB ==================== */}
          {mainTab === 'employers' && (
            <>
              {/* Employer Action Msg */}
              {empActionMsg && (
                <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
                  empActionMsg.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <i className={`${empActionMsg.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'} text-base`} />
                    {empActionMsg.text}
                  </div>
                </div>
              )}

              {/* Employer Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {employerTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setEmpActiveTab(tab.key)}
                    className={`p-3 md:p-4 rounded-xl border transition-colors text-left ${
                      empActiveTab === tab.key
                        ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-background-200 bg-white dark:bg-background-100 hover:border-background-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <i className={`${tab.icon} text-sm ${empActiveTab === tab.key ? 'text-primary-600 dark:text-primary-400' : 'text-foreground-400'}`} />
                      <span className={`text-xs font-medium ${empActiveTab === tab.key ? 'text-primary-600 dark:text-primary-400' : 'text-foreground-500'}`}>
                        {tab.label}
                      </span>
                    </div>
                    <p className="text-xl md:text-2xl font-bold text-foreground-950">{tab.count}</p>
                  </button>
                ))}
              </div>

              {/* Employer Search */}
              <div className="mb-4 relative">
                <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-400 text-sm" />
                <input
                  type="text"
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  placeholder="Şirket adı, yetkili adı veya vergi numarası ile ara..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-background-200 bg-white dark:bg-background-100 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                />
              </div>

              {/* Employer Table */}
              {empLoading ? (
                <div className="bg-white dark:bg-background-100 rounded-xl border border-background-200 p-12 text-center">
                  <div className="animate-pulse text-sm text-foreground-500">Yükleniyor...</div>
                </div>
              ) : empError ? (
                <div className="bg-white dark:bg-background-100 rounded-xl border border-background-200 p-12 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3">
                    <i className="ri-error-warning-line text-xl text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400 mb-3">{empError}</p>
                  <button onClick={fetchEmployers} className="px-4 py-2 text-sm font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors whitespace-nowrap">
                    <i className="ri-refresh-line mr-1.5" />Tekrar Dene
                  </button>
                </div>
              ) : filterEmployers().length === 0 ? (
                <div className="bg-white dark:bg-background-100 rounded-xl border border-background-200 p-12 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-background-100 dark:bg-background-200 flex items-center justify-center mb-3">
                    <i className="ri-user-search-line text-xl text-foreground-400" />
                  </div>
                  <p className="text-sm text-foreground-500">Bu kategoride işveren bulunamadı.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-background-100 rounded-xl border border-background-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-background-200 bg-background-50 dark:bg-background-50">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider whitespace-nowrap">Şirket / Yetkili</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Vergi No</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">Şehir</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Başvuru Tarihi</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider whitespace-nowrap">Durum</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider whitespace-nowrap">İşlem</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filterEmployers().map((emp) => (
                          <tr key={emp.id} className="border-b border-background-100 dark:border-background-200 last:border-0 hover:bg-background-50 dark:hover:bg-background-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-sm font-medium text-foreground-950">{emp.company_name || 'Belirtilmemiş'}</p>
                                <p className="text-xs text-foreground-500 mt-0.5">{emp.full_name || '—'}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              <span className="text-sm text-foreground-700 font-mono">{emp.vergi_numarasi || '—'}</span>
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              <span className="text-sm text-foreground-600">{emp.city || '—'}</span>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              <span className="text-xs text-foreground-500">{formatDate(emp.dogrulama_talebi_tarihi)}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${empStatusStyle[emp.dogrulama_durumu] || empStatusStyle.unverified}`}>
                                {empStatusLabel[emp.dogrulama_durumu] || 'Doğrulanmamış'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button onClick={() => setEmpDetailModal(emp)} className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground-400 hover:text-foreground-600 hover:bg-background-100 dark:hover:bg-background-200 transition-colors" title="Detay">
                                  <i className="ri-eye-line text-sm" />
                                </button>
                                {emp.dogrulama_durumu === 'pending' && (
                                  <button onClick={() => handleApproveEmployer(emp.id)} disabled={empActionLoading === emp.id} className="w-8 h-8 rounded-lg flex items-center justify-center text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50" title="Onayla">
                                    {empActionLoading === emp.id ? <i className="ri-loader-4-line animate-spin text-sm" /> : <i className="ri-check-line text-sm" />}
                                  </button>
                                )}
                                {(emp.dogrulama_durumu === 'pending' || emp.dogrulama_durumu === 'verified') && (
                                  <button onClick={() => handleRejectEmployer(emp.id)} disabled={empActionLoading === emp.id} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50" title="Reddet">
                                    {empActionLoading === emp.id ? <i className="ri-loader-4-line animate-spin text-sm" /> : <i className="ri-close-line text-sm" />}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==================== JOBS TAB ==================== */}
          {mainTab === 'jobs' && (
            <>
              {/* Job Action Msg */}
              {jobActionMsg && (
                <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
                  jobActionMsg.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <i className={`${jobActionMsg.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'} text-base`} />
                    {jobActionMsg.text}
                  </div>
                </div>
              )}

              {/* Job Stats + Extra Info */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {jobTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setJobActiveTab(tab.key)}
                    className={`p-3 md:p-4 rounded-xl border transition-colors text-left ${
                      jobActiveTab === tab.key
                        ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-background-200 bg-white dark:bg-background-100 hover:border-background-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <i className={`${tab.icon} text-sm ${jobActiveTab === tab.key ? 'text-primary-600 dark:text-primary-400' : 'text-foreground-400'}`} />
                      <span className={`text-xs font-medium ${jobActiveTab === tab.key ? 'text-primary-600 dark:text-primary-400' : 'text-foreground-500'}`}>
                        {tab.label}
                      </span>
                    </div>
                    <p className="text-xl md:text-2xl font-bold text-foreground-950">{tab.count}</p>
                  </button>
                ))}
                <div className="p-3 md:p-4 rounded-xl border border-background-200 bg-white dark:bg-background-100 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <i className="ri-archive-line text-sm text-foreground-400" />
                    <span className="text-xs font-medium text-foreground-500">Kapalı / Süresi Dolmuş</span>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-foreground-950">{jobStats.closed + jobStats.expired}</p>
                </div>
              </div>

              {/* Job Search */}
              <div className="mb-4 relative">
                <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-400 text-sm" />
                <input
                  type="text"
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  placeholder="İlan başlığı, şirket adı veya sektör ile ara..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-background-200 bg-white dark:bg-background-100 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                />
              </div>

              {/* Job Table */}
              {jobLoading ? (
                <div className="bg-white dark:bg-background-100 rounded-xl border border-background-200 p-12 text-center">
                  <div className="animate-pulse text-sm text-foreground-500">Yükleniyor...</div>
                </div>
              ) : jobError ? (
                <div className="bg-white dark:bg-background-100 rounded-xl border border-background-200 p-12 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3">
                    <i className="ri-error-warning-line text-xl text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400 mb-3">{jobError}</p>
                  <button onClick={fetchJobs} className="px-4 py-2 text-sm font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors whitespace-nowrap">
                    <i className="ri-refresh-line mr-1.5" />Tekrar Dene
                  </button>
                </div>
              ) : filterJobs().length === 0 ? (
                <div className="bg-white dark:bg-background-100 rounded-xl border border-background-200 p-12 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-background-100 dark:bg-background-200 flex items-center justify-center mb-3">
                    <i className="ri-file-search-line text-xl text-foreground-400" />
                  </div>
                  <p className="text-sm text-foreground-500">Bu kategoride ilan bulunamadı.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-background-100 rounded-xl border border-background-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-background-200 bg-background-50 dark:bg-background-50">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider whitespace-nowrap">İlan / Şirket</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">İşveren</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">Sektör / Şehir</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Tarih</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider whitespace-nowrap">Durum</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider whitespace-nowrap">İşlem</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filterJobs().map((job) => (
                          <tr key={job.id} className="border-b border-background-100 dark:border-background-200 last:border-0 hover:bg-background-50 dark:hover:bg-background-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-sm font-medium text-foreground-950 line-clamp-1">{job.title}</p>
                                <p className="text-xs text-foreground-500 mt-0.5">{job.company_name}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              <div>
                                <p className="text-xs text-foreground-700">{job.employer_full_name || '—'}</p>
                                {job.employer_vergi && (
                                  <p className="text-xs text-foreground-400 font-mono mt-0.5">{job.employer_vergi}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              <div>
                                <p className="text-xs text-foreground-600">{job.sector}</p>
                                <p className="text-xs text-foreground-400 mt-0.5">{job.city}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              <span className="text-xs text-foreground-500">{formatShortDate(job.created_at)}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${jobStatusStyle[job.status] || jobStatusStyle.pending}`}>
                                {jobStatusLabel[job.status] || 'Onay Bekliyor'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button onClick={() => setJobDetailModal(job)} className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground-400 hover:text-foreground-600 hover:bg-background-100 dark:hover:bg-background-200 transition-colors" title="Detay">
                                  <i className="ri-eye-line text-sm" />
                                </button>
                                {job.status === 'pending' && (
                                  <button onClick={() => handleApproveJob(job.id)} disabled={jobActionLoading === job.id} className="w-8 h-8 rounded-lg flex items-center justify-center text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50" title="Onayla">
                                    {jobActionLoading === job.id ? <i className="ri-loader-4-line animate-spin text-sm" /> : <i className="ri-check-line text-sm" />}
                                  </button>
                                )}
                                {(job.status === 'pending' || job.status === 'active') && (
                                  <button onClick={() => job.status === 'pending' ? handleRejectJob(job.id) : handleCloseJob(job.id)} disabled={jobActionLoading === job.id} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50" title={job.status === 'pending' ? 'Reddet' : 'Kapat'}>
                                    {jobActionLoading === job.id ? <i className="ri-loader-4-line animate-spin text-sm" /> : <i className="ri-close-line text-sm" />}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==================== PAYMENTS TAB ==================== */}
          {mainTab === 'payments' && (
            <div>
              <h2 className="font-heading font-semibold text-lg mb-4">Sipariş / Ödeme Kayıtları</h2>
              <PaymentsSection />
            </div>
          )}

          {/* ==================== STATS TAB ==================== */}
          {mainTab === 'stats' && (
            <DashboardSection />
          )}
        </div>
      </main>

      {/* Employer Detail Modal */}
      {empDetailModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEmpDetailModal(null)} />
          <div className="relative bg-white dark:bg-background-100 rounded-xl border border-background-200 shadow-lg w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-background-100 border-b border-background-200 px-5 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="font-heading font-bold text-base text-foreground-950">İşveren Detayı</h3>
              <button onClick={() => setEmpDetailModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground-400 hover:text-foreground-600 hover:bg-background-100 dark:hover:bg-background-200 transition-colors">
                <i className="ri-close-line" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-background-100 dark:border-background-200">
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-lg">
                  {(empDetailModal.company_name || empDetailModal.full_name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground-950">{empDetailModal.company_name || 'Belirtilmemiş'}</p>
                  <p className="text-xs text-foreground-500">{empDetailModal.full_name || '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-foreground-400 mb-0.5">Vergi Numarası</p>
                  <p className="font-mono font-medium text-foreground-950">{empDetailModal.vergi_numarasi || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-foreground-400 mb-0.5">Telefon</p>
                  <p className="text-foreground-700">{empDetailModal.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-foreground-400 mb-0.5">Şehir</p>
                  <p className="text-foreground-700">{empDetailModal.city || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-foreground-400 mb-0.5">Durum</p>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${empStatusStyle[empDetailModal.dogrulama_durumu]}`}>
                    {empStatusLabel[empDetailModal.dogrulama_durumu]}
                  </span>
                </div>
              </div>
              <div className="text-sm">
                <p className="text-xs text-foreground-400 mb-0.5">Doğrulama Talebi</p>
                <p className="text-foreground-700">{formatDate(empDetailModal.dogrulama_talebi_tarihi)}</p>
              </div>
              {empDetailModal.dogrulanma_tarihi && (
                <div className="text-sm">
                  <p className="text-xs text-foreground-400 mb-0.5">Son İşlem Tarihi</p>
                  <p className="text-foreground-700">{formatDate(empDetailModal.dogrulanma_tarihi)}</p>
                </div>
              )}
              <div className="flex items-center gap-2 pt-3 border-t border-background-100 dark:border-background-200">
                {empDetailModal.dogrulama_durumu === 'pending' && (
                  <>
                    <button onClick={() => { handleApproveEmployer(empDetailModal.id); setEmpDetailModal(null); }} className="flex-1 px-4 py-2.5 text-sm font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors whitespace-nowrap">
                      <i className="ri-check-line mr-1.5" />Onayla
                    </button>
                    <button onClick={() => { handleRejectEmployer(empDetailModal.id); setEmpDetailModal(null); }} className="flex-1 px-4 py-2.5 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors whitespace-nowrap">
                      <i className="ri-close-line mr-1.5" />Reddet
                    </button>
                  </>
                )}
                {(empDetailModal.dogrulama_durumu === 'verified' || empDetailModal.dogrulama_durumu === 'rejected') && (
                  <button onClick={() => setEmpDetailModal(null)} className="w-full px-4 py-2.5 text-sm font-medium bg-background-100 dark:bg-background-200 text-foreground-700 rounded-lg hover:bg-background-200 dark:hover:bg-background-300 transition-colors whitespace-nowrap">
                    Kapat
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Detail Modal */}
      {jobDetailModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setJobDetailModal(null)} />
          <div className="relative bg-white dark:bg-background-100 rounded-xl border border-background-200 shadow-lg w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-background-100 border-b border-background-200 px-5 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="font-heading font-bold text-base text-foreground-950">İlan Detayı</h3>
              <button onClick={() => setJobDetailModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground-400 hover:text-foreground-600 hover:bg-background-100 dark:hover:bg-background-200 transition-colors">
                <i className="ri-close-line" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="pb-3 border-b border-background-100 dark:border-background-200">
                <h4 className="font-heading font-semibold text-base text-foreground-950 mb-1">{jobDetailModal.title}</h4>
                <p className="text-sm text-foreground-600">{jobDetailModal.company_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-foreground-400 mb-0.5">İşveren</p>
                  <p className="text-foreground-700">{jobDetailModal.employer_full_name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-foreground-400 mb-0.5">Vergi No</p>
                  <p className="font-mono text-foreground-700">{jobDetailModal.employer_vergi || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-foreground-400 mb-0.5">Sektör</p>
                  <p className="text-foreground-700">{jobDetailModal.sector}</p>
                </div>
                <div>
                  <p className="text-xs text-foreground-400 mb-0.5">Şehir</p>
                  <p className="text-foreground-700">{jobDetailModal.city}</p>
                </div>
                <div>
                  <p className="text-xs text-foreground-400 mb-0.5">Çalışma Tipi</p>
                  <p className="text-foreground-700">{jobTypeLabels[jobDetailModal.job_type] || jobDetailModal.job_type}</p>
                </div>
                <div>
                  <p className="text-xs text-foreground-400 mb-0.5">Deneyim</p>
                  <p className="text-foreground-700">{experienceLabels[jobDetailModal.experience_level] || jobDetailModal.experience_level}</p>
                </div>
                {jobDetailModal.salary_min && jobDetailModal.salary_max && (
                  <div className="col-span-2">
                    <p className="text-xs text-foreground-400 mb-0.5">Maaş Aralığı</p>
                    <p className="text-foreground-700 font-medium">
                      {jobDetailModal.salary_min.toLocaleString('tr-TR')} - {jobDetailModal.salary_max.toLocaleString('tr-TR')} TL
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-foreground-400 mb-0.5">Durum</p>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${jobStatusStyle[jobDetailModal.status]}`}>
                    {jobStatusLabel[jobDetailModal.status]}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-foreground-400 mb-0.5">Yayınlanma</p>
                  <p className="text-foreground-700">{formatShortDate(jobDetailModal.created_at)}</p>
                </div>
              </div>

              <div className="text-sm">
                <p className="text-xs text-foreground-400 mb-1">Açıklama</p>
                <p className="text-foreground-700 leading-relaxed max-h-32 overflow-y-auto">
                  {jobDetailModal.description.length > 300
                    ? jobDetailModal.description.slice(0, 300) + '...'
                    : jobDetailModal.description}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-background-100 dark:border-background-200">
                {jobDetailModal.status === 'pending' && (
                  <>
                    <button onClick={() => { handleApproveJob(jobDetailModal.id); setJobDetailModal(null); }} className="flex-1 px-4 py-2.5 text-sm font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors whitespace-nowrap">
                      <i className="ri-check-line mr-1.5" />Onayla ve Yayınla
                    </button>
                    <button onClick={() => { handleRejectJob(jobDetailModal.id); setJobDetailModal(null); }} className="flex-1 px-4 py-2.5 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors whitespace-nowrap">
                      <i className="ri-close-line mr-1.5" />Reddet
                    </button>
                  </>
                )}
                {jobDetailModal.status === 'active' && (
                  <button onClick={() => { handleCloseJob(jobDetailModal.id); setJobDetailModal(null); }} className="flex-1 px-4 py-2.5 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors whitespace-nowrap">
                    <i className="ri-close-line mr-1.5" />İlanı Kapat
                  </button>
                )}
                {(jobDetailModal.status === 'rejected' || jobDetailModal.status === 'closed' || jobDetailModal.status === 'expired') && (
                  <button onClick={() => setJobDetailModal(null)} className="w-full px-4 py-2.5 text-sm font-medium bg-background-100 dark:bg-background-200 text-foreground-700 rounded-lg hover:bg-background-200 dark:hover:bg-background-300 transition-colors whitespace-nowrap">
                    Kapat
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}