import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import ApplicationsSection from '@/pages/profil/isveren/components/ApplicationsSection';
import { fetchCredits } from '@/lib/credits';
import { downloadInvoicePdf } from '@/lib/invoice';

interface JobListing {
  id: string;
  title: string;
  company_name: string;
  city: string;
  sector: string;
  job_type: string;
  status: string;
  featured: boolean;
  created_at: string;
  expires_at: string;
  application_count: number;
}

interface ApplicationItem {
  id: string;
  job_id: string;
  candidate_id: string;
  status: string;
  cover_letter: string | null;
  created_at: string;
  job_title: string;
  candidate_name: string;
  candidate_email: string;
}

export default function EmployerProfilePage() {
  const { user, profile, updateProfile, loading } = useAuth();
  const location = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [myJobs, setMyJobs] = useState<JobListing[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [appsLoading, setAppsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [tab, setTab] = useState<'profile' | 'jobs' | 'applications'>(
    location.pathname.includes('ilanlarim') ? 'jobs' : 'profile',
  );
  const [selectedJobApplications, setSelectedJobApplications] = useState<ApplicationItem[]>([]);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [requestingVerification, setRequestingVerification] = useState(false);
  const [verificationMsg, setVerificationMsg] = useState('');
  const [jobActionMsg, setJobActionMsg] = useState('');

  useEffect(() => {
    if (location.pathname.includes('ilanlarim')) setTab('jobs');
  }, [location.pathname]);

  const [form, setForm] = useState({
    full_name: '',
    company_name: '',
    phone: '',
    city: '',
    bio: '',
    vergi_numarasi: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        company_name: profile.company_name || '',
        phone: profile.phone || '',
        city: profile.city || '',
        bio: profile.bio || '',
        vergi_numarasi: profile.vergi_numarasi || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    const fetchMyJobs = async () => {
      setJobsLoading(true);
      try {
        const [jobs, apps] = await Promise.all([
          api<Omit<JobListing, 'application_count'>[]>(`/api/jobs?employer_id=${user.id}`),
          api<{ job_id: string }[]>('/api/applications/employer'),
        ]);
        const countByJob: Record<string, number> = {};
        for (const a of apps || []) {
          countByJob[a.job_id] = (countByJob[a.job_id] || 0) + 1;
        }
        setMyJobs(
          (jobs || []).map((job) => ({
            ...job,
            application_count: countByJob[job.id] || 0,
          })),
        );
      } catch {
        // silent
      } finally {
        setJobsLoading(false);
      }
    };
    fetchMyJobs();
  }, [user]);

  const fetchJobApplications = async (jobId: string) => {
    setAppsLoading(true);
    try {
      const data = await api<ApplicationItem[]>('/api/applications/employer');
      setSelectedJobApplications(
        (data || [])
          .filter((a) => a.job_id === jobId)
          .map((a) => ({
            ...a,
            job_title: a.job_title || '',
            candidate_name: a.candidate_name || 'Anonim',
            candidate_email: a.candidate_email || '',
          })),
      );
      setShowApplicationsModal(true);
    } catch {
      // silent
    } finally {
      setAppsLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');

    if (form.vergi_numarasi && form.vergi_numarasi.trim().length > 0) {
      const cleaned = form.vergi_numarasi.replace(/\s/g, '');
      if (!/^\d{10}$/.test(cleaned)) {
        setSaving(false);
        setSaveMsg('Vergi numarası tam olarak 10 haneli olmalıdır.');
        return;
      }
    }

    const result = await updateProfile(form);
    setSaving(false);
    if (result.success) {
      setSaveMsg('Profil başarıyla güncellendi!');
      setIsEditing(false);
      setTimeout(() => setSaveMsg(''), 3000);
    } else {
      setSaveMsg(result.error || 'Güncelleme başarısız');
    }
  };

  const handleRequestVerification = async () => {
    if (!form.vergi_numarasi || form.vergi_numarasi.trim().length === 0) {
      setVerificationMsg('Doğrulama talebi için önce vergi numaranızı girmelisiniz.');
      return;
    }

    const cleaned = form.vergi_numarasi.replace(/\s/g, '');
    if (!/^\d{10}$/.test(cleaned)) {
      setVerificationMsg('Vergi numarası tam olarak 10 haneli olmalıdır.');
      return;
    }

    setRequestingVerification(true);
    setVerificationMsg('');

    try {
      const result = await updateProfile({
        vergi_numarasi: cleaned,
        dogrulama_durumu: 'pending',
        dogrulama_talebi_tarihi: new Date().toISOString(),
      });

      if (!result.success) throw new Error(result.error || 'Hata');

      setVerificationMsg('Doğrulama talebiniz alındı. Vergi numaranız incelendikten sonra ilan vermeye başlayabilirsiniz. Bu işlem genellikle 1-2 iş günü sürer.');

      if (profile) {
        profile.vergi_numarasi = cleaned;
        profile.dogrulama_durumu = 'pending';
        profile.dogrulama_talebi_tarihi = new Date().toISOString();
      }

      setForm((prev) => ({ ...prev, vergi_numarasi: cleaned }));
    } catch {
      setVerificationMsg('Doğrulama talebi gönderilirken bir hata oluştu.');
    } finally {
      setRequestingVerification(false);
    }
  };

  const handleUpdateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      await api(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        body: { status: newStatus },
      });

      setSelectedJobApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status: newStatus } : a))
      );
    } catch {
      // silent
    }
  };

  const handleRenewJob = async (jobId: string) => {
    if (!user) return;
    setJobActionMsg('');
    const credits = await fetchCredits(user.id);
    if (!credits.length) {
      setJobActionMsg('Yenilemek için paket hakkınız yok. Önce paket satın alın.');
      return;
    }
    try {
      const updated = await api<{
        expires_at: string;
        status: string;
        featured: boolean;
      }>(`/api/jobs/${jobId}/renew`, {
        body: { credit_id: credits[0].id },
      });
      setMyJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                expires_at: updated.expires_at,
                status: updated.status,
                featured: updated.featured,
              }
            : j,
        ),
      );
      setJobActionMsg('İlan paket hakkınızla yenilendi.');
    } catch (err) {
      setJobActionMsg(err instanceof Error ? err.message : 'Yenileme başarısız');
    }
  };

  const handleCloseJob = async (jobId: string) => {
    if (!user) return;
    try {
      await api(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        body: { status: 'closed' },
      });
      setMyJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: 'closed' } : j)));
    } catch (err) {
      setJobActionMsg(err instanceof Error ? err.message : 'Kapatma başarısız');
    }
  };

  const handleDownloadLastInvoice = async () => {
    if (!user) return;
    try {
      const rows = await api<{
        id: string;
        package_name: string;
        amount: number;
        buyer_name: string | null;
        buyer_email: string | null;
        company_name: string | null;
        tax_id: string | null;
        billing_address: string | null;
        created_at: string;
        status: string;
      }[]>('/api/payments');
      const data = rows?.[0];
      if (!data) {
        setJobActionMsg('İndirilecek fatura kaydı bulunamadı.');
        return;
      }
      downloadInvoicePdf({
        id: data.id,
        packageName: data.package_name,
        amount: data.amount,
        buyerName: data.buyer_name,
        buyerEmail: data.buyer_email,
        companyName: data.company_name,
        taxId: data.tax_id,
        billingAddress: data.billing_address,
        createdAt: data.created_at,
        status: data.status,
      });
    } catch {
      setJobActionMsg('İndirilecek fatura kaydı bulunamadı.');
    }
  };

  const statusLabels: Record<string, string> = {
    pending: 'Değerlendiriliyor',
    reviewed: 'İncelendi',
    accepted: 'Kabul Edildi',
    rejected: 'Reddedildi',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    reviewed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  const jobStatusLabels: Record<string, string> = {
    active: 'Aktif',
    pending: 'Onay Bekliyor',
    expired: 'Süresi Doldu',
    closed: 'Kapatıldı',
  };

  const jobStatusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  };

  const verificationStatusConfig: Record<string, { label: string; color: string; icon: string; description: string }> = {
    unverified: {
      label: 'Doğrulanmamış',
      color: 'bg-red-50 border-red-300 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300',
      icon: 'ri-shield-cross-line',
      description: 'İlan vermek için vergi numaranızı girip doğrulama talebinde bulunmalısınız.',
    },
    pending: {
      label: 'Doğrulama Bekliyor',
      color: 'bg-yellow-50 border-yellow-300 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-300',
      icon: 'ri-time-line',
      description: 'Vergi numaranız inceleniyor. Doğrulama tamamlandığında ilan vermeye başlayabilirsiniz.',
    },
    verified: {
      label: 'Doğrulanmış',
      color: 'bg-green-50 border-green-300 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300',
      icon: 'ri-verified-badge-line',
      description: 'Hesabınız doğrulanmıştır. Güvenle ilan verebilirsiniz.',
    },
    rejected: {
      label: 'Doğrulama Reddedildi',
      color: 'bg-red-50 border-red-300 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300',
      icon: 'ri-close-circle-line',
      description: 'Vergi numaranız doğrulanamadı. Lütfen bilgilerinizi kontrol edip tekrar deneyin veya bizimle iletişime geçin.',
    },
  };

  if (loading) {
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

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <i className="ri-building-line text-5xl text-foreground-300 mb-4 block" />
            <h1 className="font-heading font-bold text-2xl text-foreground-700 mb-2">Giriş Yapmalısınız</h1>
            <p className="text-sm text-foreground-500 mb-4">İşveren panelinize erişmek için lütfen giriş yapın.</p>
            <Link to="/giris" className="px-6 py-2.5 bg-primary-500 text-white font-medium text-sm rounded-lg hover:bg-primary-600 transition-colors">
              Giriş Yap
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const verStatus = verificationStatusConfig[profile.dogrulama_durumu || 'unverified'];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 md:pt-24 pb-12">
        <div className="px-4 md:px-6 lg:px-8 max-w-5xl mx-auto">

          {/* Verification Status Banner */}
          <div className={`rounded-xl border p-4 md:p-5 mb-6 ${verStatus.color}`}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-white/50 dark:bg-black/20 flex items-center justify-center shrink-0 mt-0.5">
                <i className={`${verStatus.icon} text-lg`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-heading font-semibold text-sm md:text-base">Kimlik Doğrulama Durumu: {verStatus.label}</h3>
                </div>
                <p className="text-xs md:text-sm opacity-80">{verStatus.description}</p>

                {profile.dogrulama_durumu === 'rejected' && (
                  <button
                    onClick={handleRequestVerification}
                    disabled={requestingVerification}
                    className="mt-3 px-4 py-2 bg-white dark:bg-black/30 text-sm font-medium rounded-lg border border-current hover:opacity-80 transition-opacity whitespace-nowrap disabled:opacity-50"
                  >
                    {requestingVerification ? 'Gönderiliyor...' : 'Tekrar Doğrulama Talebi Gönder'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Profile Header */}
          <div className="bg-background-50 dark:bg-background-100 rounded-2xl border border-background-200 dark:border-background-200 p-6 md:p-8 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center text-accent-600 dark:text-accent-400 font-bold text-2xl md:text-3xl shrink-0">
                <i className="ri-building-line" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-xl md:text-2xl text-foreground-950">
                  {profile.company_name || profile.full_name}
                </h1>
                <p className="text-sm text-foreground-500">
                  {profile.city && `${profile.city} · `}İşveren
                </p>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="ml-auto px-4 py-2 text-sm font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors whitespace-nowrap"
                >
                  <i className="ri-pencil-line mr-1" />
                  Profili Düzenle
                </button>
              )}
            </div>

            {isEditing && (
              <div className="space-y-4 border-t border-background-200 pt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">Yetkili Ad Soyad</label>
                    <input
                      type="text"
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-background-100 dark:bg-background-50 border border-background-200 text-sm text-foreground-950 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">Şirket Adı</label>
                    <input
                      type="text"
                      value={form.company_name}
                      onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-background-100 dark:bg-background-50 border border-background-200 text-sm text-foreground-950 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">Telefon</label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-background-100 dark:bg-background-50 border border-background-200 text-sm text-foreground-950 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">Şehir</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-background-100 dark:bg-background-50 border border-background-200 text-sm text-foreground-950 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Vergi Numarası */}
                <div className="border-t border-background-200 pt-4 mt-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-foreground-950 mb-1.5">
                    <i className="ri-shield-check-line text-accent-600" />
                    Vergi Numarası (İlan vermek için zorunludur)
                  </label>
                  <p className="text-xs text-foreground-500 mb-2">
                    10 haneli vergi numaranızı girin. Bu bilgi platform güvenliği için kullanılır, hiçbir yerde yayınlanmaz.
                  </p>
                  <input
                    type="text"
                    value={form.vergi_numarasi}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setForm({ ...form, vergi_numarasi: val });
                    }}
                    placeholder="Örn: 1234567890"
                    maxLength={10}
                    className="w-full max-w-xs px-3 py-2 rounded-lg bg-background-100 dark:bg-background-50 border border-background-200 text-sm text-foreground-950 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent font-mono tracking-widest"
                  />
                  {form.vergi_numarasi && form.vergi_numarasi.length < 10 && (
                    <p className="text-xs text-red-500 mt-1">Vergi numarası 10 haneli olmalıdır.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">Şirket Hakkında</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-background-100 dark:bg-background-50 border border-background-200 text-sm text-foreground-950 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
                    placeholder="Şirketinizden kısaca bahsedin..."
                  />
                </div>

                {saveMsg && (
                  <div className={`p-3 rounded-lg text-sm ${saveMsg.includes('başarıyla') ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'}`}>
                    {saveMsg}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-5 py-2.5 bg-primary-500 text-white font-medium text-sm rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-60 whitespace-nowrap"
                  >
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-5 py-2.5 bg-background-100 dark:bg-background-50 border border-background-200 text-foreground-700 font-medium text-sm rounded-lg hover:bg-background-200 transition-colors whitespace-nowrap"
                  >
                    İptal
                  </button>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            {!isEditing && (
              <div className="grid grid-cols-3 gap-4 border-t border-background-200 pt-5 mt-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-accent-600">{myJobs.length}</p>
                  <p className="text-xs text-foreground-500">Toplam İlan</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{myJobs.filter((j) => j.status === 'active').length}</p>
                  <p className="text-xs text-foreground-500">Aktif İlan</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-600">{myJobs.reduce((sum, j) => sum + j.application_count, 0)}</p>
                  <p className="text-xs text-foreground-500">Toplam Başvuru</p>
                </div>
              </div>
            )}
          </div>

          {/* Doğrulama Talebi Butonu (sadece unverified ve rejected durumlarında) */}
          {(profile.dogrulama_durumu === 'unverified' || profile.dogrulama_durumu === 'rejected') && !isEditing && (
            <div className="bg-accent-50 dark:bg-accent-900/20 rounded-xl border border-accent-200 dark:border-accent-700 p-5 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="font-heading font-semibold text-sm text-accent-800 dark:text-accent-300 mb-1">
                    {profile.vergi_numarasi ? 'Doğrulama Talebi Gönderin' : 'Önce Vergi Numaranızı Girin'}
                  </h3>
                  <p className="text-xs text-accent-700 dark:text-accent-400">
                    {profile.vergi_numarasi
                      ? 'Vergi numaranız kaydedildi. Şimdi doğrulama talebi göndererek ilan vermeye başlayabilirsiniz.'
                      : 'İlan vermek için önce profilinizi düzenleyip vergi numaranızı girmelisiniz.'}
                  </p>
                </div>
                {profile.vergi_numarasi ? (
                  <button
                    onClick={handleRequestVerification}
                    disabled={requestingVerification}
                    className="px-5 py-2.5 bg-accent-600 text-white font-medium text-sm rounded-lg hover:bg-accent-700 transition-colors disabled:opacity-60 whitespace-nowrap"
                  >
                    <i className="ri-shield-check-line mr-1" />
                    {requestingVerification ? 'Gönderiliyor...' : 'Doğrulama Talebi Gönder'}
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-5 py-2.5 bg-accent-600 text-white font-medium text-sm rounded-lg hover:bg-accent-700 transition-colors whitespace-nowrap"
                  >
                    <i className="ri-pencil-line mr-1" />
                    Profili Düzenle
                  </button>
                )}
              </div>
              {verificationMsg && (
                <p className={`mt-3 text-xs font-medium ${verificationMsg.includes('alındı') ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  {verificationMsg}
                </p>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-background-100 dark:bg-background-50 rounded-lg mb-6 max-w-lg">
            <button
              onClick={() => setTab('profile')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                tab === 'profile' ? 'bg-background-50 shadow-sm text-foreground-950 dark:bg-background-100 dark:text-foreground-950' : 'text-foreground-600 hover:text-foreground-700'
              }`}
            >
              Profil Bilgileri
            </button>
            <button
              onClick={() => setTab('jobs')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                tab === 'jobs' ? 'bg-background-50 shadow-sm text-foreground-950 dark:bg-background-100 dark:text-foreground-950' : 'text-foreground-600 hover:text-foreground-700'
              }`}
            >
              İlanlarım ({myJobs.length})
            </button>
            <button
              onClick={() => setTab('applications')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                tab === 'applications' ? 'bg-background-50 shadow-sm text-foreground-950 dark:bg-background-100 dark:text-foreground-950' : 'text-foreground-600 hover:text-foreground-700'
              }`}
            >
              <i className="ri-file-list-3-line mr-1" />
              Başvurular
            </button>
          </div>

          {/* Tab Content */}
          {tab === 'profile' && (
            <div className="bg-background-50 dark:bg-background-100 rounded-xl border border-background-200 dark:border-background-200 p-5 md:p-6">
              <h2 className="font-heading font-semibold text-lg text-foreground-950 mb-4">Şirket Detayları</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-background-200">
                  <span className="text-sm text-foreground-500">E-posta</span>
                  <span className="text-sm text-foreground-700">{user.email}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-background-200">
                  <span className="text-sm text-foreground-500">Şirket Adı</span>
                  <span className="text-sm text-foreground-700">{profile.company_name || 'Belirtilmemiş'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-background-200">
                  <span className="text-sm text-foreground-500">Telefon</span>
                  <span className="text-sm text-foreground-700">{profile.phone || 'Belirtilmemiş'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-background-200">
                  <span className="text-sm text-foreground-500">Şehir</span>
                  <span className="text-sm text-foreground-700">{profile.city || 'Belirtilmemiş'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-background-200">
                  <span className="text-sm text-foreground-500">Vergi Numarası</span>
                  <span className="text-sm text-foreground-700 font-mono">
                    {profile.vergi_numarasi || <span className="text-red-500">Girilmemiş</span>}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-background-200">
                  <span className="text-sm text-foreground-500">Doğrulama Durumu</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${verStatus.color}`}>
                    {verStatus.label}
                  </span>
                </div>
                {profile.dogrulanma_tarihi && (
                  <div className="flex items-center justify-between py-2 border-b border-background-200">
                    <span className="text-sm text-foreground-500">Doğrulanma Tarihi</span>
                    <span className="text-sm text-foreground-700">
                      {new Date(profile.dogrulanma_tarihi).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-foreground-500">Üyelik Tarihi</span>
                  <span className="text-sm text-foreground-700">
                    {new Date(profile.created_at || '').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {tab === 'jobs' && (
            <div className="space-y-4">
              {jobActionMsg && (
                <div className="p-3 rounded-lg text-sm bg-background-100 border border-background-200">{jobActionMsg}</div>
              )}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleDownloadLastInvoice}
                  className="text-xs font-medium text-primary-600 hover:underline"
                >
                  Son fatura PDF
                </button>
              </div>
              {jobsLoading ? (
                <div className="text-center py-8 text-sm text-foreground-500 animate-pulse">İlanlarınız yükleniyor...</div>
              ) : myJobs.length === 0 ? (
                <div className="text-center py-12 bg-background-50 dark:bg-background-100 rounded-xl border border-background-200 dark:border-background-200">
                  <i className="ri-briefcase-line text-4xl text-foreground-300 mb-3 block" />
                  <p className="text-sm text-foreground-500">Henüz bir ilanınız bulunmuyor.</p>
                  <Link to="/ilan-ekle" className="inline-block mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium">
                    İlk İlanınızı Verin
                  </Link>
                </div>
              ) : (
                myJobs.map((job) => (
                  <div key={job.id} className="bg-background-50 dark:bg-background-100 rounded-xl border border-background-200 dark:border-background-200 p-4 md:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Link to={`/ilan/${job.id}`} className="font-heading font-semibold text-sm md:text-base text-foreground-950 hover:text-primary-600 transition-colors">
                            {job.title}
                          </Link>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${jobStatusColors[job.status] || ''}`}>
                            {jobStatusLabels[job.status] || job.status}
                          </span>
                        </div>
                        <p className="text-xs text-foreground-500">
                          {job.city} · {job.sector} · Bitiş: {job.expires_at ? new Date(job.expires_at).toLocaleDateString('tr-TR') : '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <Link
                          to={`/ilan/${job.id}/duzenle`}
                          className="px-3 py-1.5 text-xs font-medium bg-background-200 rounded-lg hover:bg-background-300 whitespace-nowrap"
                        >
                          Düzenle
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleRenewJob(job.id)}
                          className="px-3 py-1.5 text-xs font-medium bg-primary-100 text-primary-800 rounded-lg whitespace-nowrap"
                        >
                          Yenile
                        </button>
                        {job.status !== 'closed' && (
                          <button
                            type="button"
                            onClick={() => handleCloseJob(job.id)}
                            className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded-lg whitespace-nowrap"
                          >
                            Kapat
                          </button>
                        )}
                        <button
                          onClick={() => fetchJobApplications(job.id)}
                          className="px-3 py-1.5 text-xs font-medium bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-300 rounded-lg hover:bg-secondary-200 transition-colors whitespace-nowrap"
                        >
                          <i className="ri-file-list-line mr-1" />
                          Başvurular ({job.application_count})
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'applications' && (
            <ApplicationsSection employerId={user.id} />
          )}
        </div>
      </main>

      {/* Applications Modal */}
      {showApplicationsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setShowApplicationsModal(false)}>
          <div
            className="bg-background-50 dark:bg-background-100 rounded-2xl border border-background-200 dark:border-background-200 w-full max-w-2xl max-h-[80vh] overflow-y-auto p-5 md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-lg text-foreground-950">Başvurular</h3>
              <button
                onClick={() => setShowApplicationsModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-background-200 transition-colors"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            {appsLoading ? (
              <div className="text-center py-8 text-sm text-foreground-500 animate-pulse">Başvurular yükleniyor...</div>
            ) : selectedJobApplications.length === 0 ? (
              <div className="text-center py-8 text-sm text-foreground-500">Henüz başvuru yapılmamış.</div>
            ) : (
              <div className="space-y-3">
                {selectedJobApplications.map((app) => (
                  <div key={app.id} className="p-4 rounded-xl border border-background-200 bg-background-100 dark:bg-background-50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground-950">{app.candidate_name}</p>
                        <p className="text-xs text-foreground-500">{new Date(app.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[app.status] || ''}`}>
                        {statusLabels[app.status] || app.status}
                      </span>
                    </div>
                    {app.cover_letter && (
                      <p className="text-xs text-foreground-600 bg-background-50 dark:bg-background-100 rounded-lg p-2 mb-2">{app.cover_letter}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateApplicationStatus(app.id, 'reviewed')}
                        className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        İncele
                      </button>
                      <button
                        onClick={() => handleUpdateApplicationStatus(app.id, 'accepted')}
                        className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors"
                      >
                        Kabul Et
                      </button>
                      <button
                        onClick={() => handleUpdateApplicationStatus(app.id, 'rejected')}
                        className="px-2.5 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                      >
                        Reddet
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}