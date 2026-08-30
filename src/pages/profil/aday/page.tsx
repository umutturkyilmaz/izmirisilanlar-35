import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { uploadUserFile } from '@/lib/storage';

interface Application {
  id: string;
  job_id: string;
  status: string;
  cover_letter: string | null;
  created_at: string;
  job_title: string;
  company_name: string;
  city: string;
  sector: string;
}

export default function CandidateProfilePage() {
  const { user, profile, updateProfile, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<'profile' | 'applications'>('profile');

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    city: '',
    bio: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        city: profile.city || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    const fetchApplications = async () => {
      setAppsLoading(true);
      try {
        const data = await api<Application[]>('/api/applications/mine');
        setApplications(
          (data || []).map((row) => ({
            ...row,
            job_title: row.job_title || 'Belirtilmemiş',
            company_name: row.company_name || '',
            city: row.city || '',
            sector: row.sector || '',
          })),
        );
      } catch {
        // silent fail
      } finally {
        setAppsLoading(false);
      }
    };
    fetchApplications();
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
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

  const handleAvatar = async (file: File | null) => {
    if (!file || !user) return;
    setUploading(true);
    setUploadMsg('');
    const { url, error } = await uploadUserFile('avatars', user.id, file);
    if (error || !url) {
      setUploadMsg(error || 'Avatar yüklenemedi');
      setUploading(false);
      return;
    }
    const result = await updateProfile({ avatar_url: url });
    setUploading(false);
    setUploadMsg(result.success ? 'Fotoğraf güncellendi.' : result.error || 'Kayıt başarısız');
  };

  const handleCv = async (file: File | null) => {
    if (!file || !user) return;
    setUploading(true);
    setUploadMsg('');
    const { url, error } = await uploadUserFile('cvs', user.id, file);
    if (error || !url) {
      setUploadMsg(error || 'CV yüklenemedi');
      setUploading(false);
      return;
    }
    const result = await updateProfile({ cv_url: url });
    setUploading(false);
    setUploadMsg(result.success ? 'CV yüklendi.' : result.error || 'Kayıt başarısız');
  };

  const statusLabels: Record<string, string> = {
    pending: 'Değerlendiriliyor',
    reviewed: 'İncelendi',
    reviewing: 'İnceleniyor',
    accepted: 'Kabul Edildi',
    rejected: 'Reddedildi',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    reviewed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    reviewing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
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
            <i className="ri-user-line text-5xl text-foreground-300 mb-4 block" />
            <h1 className="font-heading font-bold text-2xl text-foreground-700 mb-2">Giriş Yapmalısınız</h1>
            <p className="text-sm text-foreground-500 mb-4">Profilinizi görüntülemek için lütfen giriş yapın.</p>
            <Link to="/giris" className="px-6 py-2.5 bg-primary-500 text-white font-medium text-sm rounded-lg hover:bg-primary-600 transition-colors">
              Giriş Yap
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 md:pt-24 pb-12">
        <div className="px-4 md:px-6 lg:px-8 max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="bg-background-50 dark:bg-background-100 rounded-2xl border border-background-200 dark:border-background-200 p-6 md:p-8 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative shrink-0">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-2xl md:text-3xl">
                    {profile.full_name?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                )}
                <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center cursor-pointer text-sm">
                  <i className="ri-camera-line" />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatar(e.target.files?.[0] || null)} />
                </label>
              </div>
              <div>
                <h1 className="font-heading font-bold text-xl md:text-2xl text-foreground-950">{profile.full_name}</h1>
                <p className="text-sm text-foreground-500">
                  {profile.city && `${profile.city} · `}Aday
                </p>
                {profile.bio && !isEditing && (
                  <p className="text-sm text-foreground-600 mt-1 max-w-md">{profile.bio}</p>
                )}
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

            {uploadMsg && (
              <div className="mb-4 p-3 rounded-lg text-sm bg-background-100 border border-background-200 text-foreground-700">
                {uploading ? 'Yükleniyor...' : uploadMsg}
              </div>
            )}

            {isEditing && (
              <div className="space-y-4 border-t border-background-200 pt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">Ad Soyad</label>
                    <input
                      type="text"
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-background-100 dark:bg-background-50 border border-background-200 text-sm text-foreground-950 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">Telefon</label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-background-100 dark:bg-background-50 border border-background-200 text-sm text-foreground-950 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    />
                  </div>
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
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">Hakkımda</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-background-100 dark:bg-background-50 border border-background-200 text-sm text-foreground-950 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
                    placeholder="Kendinizden kısaca bahsedin..."
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
                  <p className="text-2xl font-bold text-primary-600">{applications.length}</p>
                  <p className="text-xs text-foreground-500">Başvuru</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-accent-600">{applications.filter((a) => a.status === 'reviewed' || a.status === 'accepted').length}</p>
                  <p className="text-xs text-foreground-500">Olumlu</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-secondary-600">{applications.filter((a) => a.status === 'pending').length}</p>
                  <p className="text-xs text-foreground-500">Bekleyen</p>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-background-100 dark:bg-background-50 rounded-lg mb-6 max-w-xs">
            <button
              onClick={() => setTab('profile')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                tab === 'profile' ? 'bg-background-50 shadow-sm text-foreground-950 dark:bg-background-100 dark:text-foreground-950' : 'text-foreground-600 hover:text-foreground-700'
              }`}
            >
              Profil Bilgileri
            </button>
            <button
              onClick={() => setTab('applications')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                tab === 'applications' ? 'bg-background-50 shadow-sm text-foreground-950 dark:bg-background-100 dark:text-foreground-950' : 'text-foreground-600 hover:text-foreground-700'
              }`}
            >
              Başvurularım ({applications.length})
            </button>
          </div>

          {/* Tab Content */}
          {tab === 'profile' ? (
            <div className="space-y-4">
            <div className="bg-background-50 dark:bg-background-100 rounded-xl border border-background-200 dark:border-background-200 p-5 md:p-6">
              <h2 className="font-heading font-semibold text-lg text-foreground-950 mb-4">Profil Detayları</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-background-200">
                  <span className="text-sm text-foreground-500">E-posta</span>
                  <span className="text-sm text-foreground-700">{user.email}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-background-200">
                  <span className="text-sm text-foreground-500">Telefon</span>
                  <span className="text-sm text-foreground-700">{profile.phone || 'Belirtilmemiş'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-background-200">
                  <span className="text-sm text-foreground-500">Şehir</span>
                  <span className="text-sm text-foreground-700">{profile.city || 'Belirtilmemiş'}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-foreground-500">Üyelik Tarihi</span>
                  <span className="text-sm text-foreground-700">
                    {new Date(profile.created_at || '').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-background-50 dark:bg-background-100 rounded-xl border border-background-200 p-5 md:p-6">
              <h2 className="font-heading font-semibold text-lg text-foreground-950 mb-3">CV</h2>
              {profile.cv_url ? (
                <a href={profile.cv_url} target="_blank" rel="noreferrer" className="text-sm text-primary-600 hover:underline inline-flex items-center gap-1 mb-3">
                  <i className="ri-file-pdf-line" /> Mevcut CV&apos;yi aç
                </a>
              ) : (
                <p className="text-sm text-foreground-500 mb-3">Henüz CV yüklenmedi.</p>
              )}
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium cursor-pointer hover:bg-primary-700">
                <i className="ri-upload-2-line" />
                {uploading ? 'Yükleniyor...' : 'CV Yükle (PDF/DOC)'}
                <input type="file" accept=".pdf,.doc,.docx,application/pdf" className="hidden" onChange={(e) => handleCv(e.target.files?.[0] || null)} />
              </label>
            </div>
            </div>
          ) : (
            <div className="space-y-4">
              {appsLoading ? (
                <div className="text-center py-8 text-sm text-foreground-500 animate-pulse">Başvurularınız yükleniyor...</div>
              ) : applications.length === 0 ? (
                <div className="text-center py-12 bg-background-50 dark:bg-background-100 rounded-xl border border-background-200 dark:border-background-200">
                  <i className="ri-file-list-line text-4xl text-foreground-300 mb-3 block" />
                  <p className="text-sm text-foreground-500">Henüz bir başvurunuz bulunmuyor.</p>
                  <Link to="/ilanlar" className="inline-block mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium">
                    İlanları Keşfedin
                  </Link>
                </div>
              ) : (
                applications.map((app) => (
                  <div key={app.id} className="bg-background-50 dark:bg-background-100 rounded-xl border border-background-200 dark:border-background-200 p-4 md:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <Link to={`/ilan/${app.job_id}`} className="font-heading font-semibold text-sm md:text-base text-foreground-950 hover:text-primary-600 transition-colors">
                          {app.job_title}
                        </Link>
                        <p className="text-xs text-foreground-500 mt-0.5">
                          {app.company_name} · {app.city} · {app.sector}
                        </p>
                        {app.cover_letter && (
                          <p className="text-xs text-foreground-600 mt-1 line-clamp-2">{app.cover_letter}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[app.status] || 'bg-gray-100 text-gray-800'}`}>
                          {statusLabels[app.status] || app.status}
                        </span>
                        <span className="text-xs text-foreground-400">
                          {new Date(app.created_at).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}