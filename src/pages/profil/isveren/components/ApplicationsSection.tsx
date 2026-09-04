import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface ApplicationFull {
  id: string;
  job_id: string;
  candidate_id: string;
  status: string;
  cover_letter: string | null;
  cv_url: string | null;
  created_at: string;
  job_title: string;
  candidate_name: string;
  candidate_email: string | null;
  candidate_phone: string | null;
}

interface ApplicationsSectionProps {
  employerId: string;
}

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

type StatusFilter = 'all' | 'pending' | 'reviewed' | 'accepted' | 'rejected';

export default function ApplicationsSection({ employerId }: ApplicationsSectionProps) {
  const [applications, setApplications] = useState<ApplicationFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkMsg, setBulkMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showBulkDropdown, setShowBulkDropdown] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apps = await api<ApplicationFull[]>('/api/applications/employer');
      setApplications(
        (apps || []).map((a) => ({
          ...a,
          job_title: a.job_title || '',
          candidate_name: a.candidate_name || 'Anonim',
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Başvurular yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [employerId]);

  useEffect(() => {
    if (employerId) fetchApplications();
  }, [employerId, fetchApplications]);

  const handleUpdateStatus = async (appId: string, newStatus: string) => {
    setUpdatingId(appId);
    try {
      await api(`/api/applications/${appId}`, { method: 'PATCH', body: { status: newStatus } });
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
      );
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(appId);
        return next;
      });
    } catch {
      // silent
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBulkUpdate = async (newStatus: string) => {
    if (selectedIds.size === 0) return;
    setBulkUpdating(true);
    setBulkMsg(null);
    setShowBulkDropdown(false);

    try {
      const ids = Array.from(selectedIds);
      await Promise.all(
        ids.map((id) => api(`/api/applications/${id}`, { method: 'PATCH', body: { status: newStatus } })),
      );

      setApplications((prev) =>
        prev.map((a) => (selectedIds.has(a.id) ? { ...a, status: newStatus } : a))
      );
      setBulkMsg({ type: 'success', text: `${ids.length} başvuru "${statusLabels[newStatus] || newStatus}" olarak güncellendi.` });
      setSelectedIds(new Set());
      setTimeout(() => setBulkMsg(null), 4000);
    } catch (err) {
      setBulkMsg({ type: 'error', text: err instanceof Error ? err.message : 'Toplu güncelleme başarısız oldu.' });
    } finally {
      setBulkUpdating(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const filtered = getFilteredApplications();
    const allSelected = filtered.every((a) => selectedIds.has(a.id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((a) => a.id)));
    }
  };

  const getFilteredApplications = () => {
    let filtered = applications;
    if (statusFilter !== 'all') {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }
    if (search.trim()) {
      const term = search.toLowerCase().trim();
      filtered = filtered.filter(
        (a) =>
          a.candidate_name.toLowerCase().includes(term) ||
          a.job_title.toLowerCase().includes(term),
      );
    }
    return filtered;
  };

  const filtered = getFilteredApplications();
  const allFilteredSelected = filtered.length > 0 && filtered.every((a) => selectedIds.has(a.id));

  const filterTabs: { key: StatusFilter; label: string; count: number; icon: string }[] = [
    { key: 'all', label: 'Tümü', count: applications.length, icon: 'ri-file-list-3-line' },
    { key: 'pending', label: 'Değerlendiriliyor', count: applications.filter((a) => a.status === 'pending').length, icon: 'ri-time-line' },
    { key: 'reviewed', label: 'İncelendi', count: applications.filter((a) => a.status === 'reviewed').length, icon: 'ri-eye-line' },
    { key: 'accepted', label: 'Kabul Edildi', count: applications.filter((a) => a.status === 'accepted').length, icon: 'ri-check-double-line' },
    { key: 'rejected', label: 'Reddedildi', count: applications.filter((a) => a.status === 'rejected').length, icon: 'ri-close-circle-line' },
  ];

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setStatusFilter(tab.key);
              setSelectedIds(new Set());
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === tab.key
                ? 'bg-primary-500 text-white'
                : 'bg-background-100 dark:bg-background-50 text-foreground-600 hover:bg-background-200 dark:hover:bg-background-100 border border-background-200'
            }`}
          >
            <i className={`${tab.icon} text-sm`} />
            {tab.label}
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
              statusFilter === tab.key ? 'bg-white/20' : 'bg-background-200 dark:bg-background-200 text-foreground-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search + Bulk Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="relative flex-1 w-full">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Aday adı veya ilan başlığı ile ara..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-background-100 dark:bg-background-50 border border-background-200 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-colors"
          />
        </div>

        {selectedIds.size > 0 && (
          <div className="relative shrink-0">
            <button
              onClick={() => setShowBulkDropdown(!showBulkDropdown)}
              className="px-4 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              <i className="ri-stack-line" />
              {selectedIds.size} Seçiliyi Güncelle
              {showBulkDropdown ? <i className="ri-arrow-up-s-line" /> : <i className="ri-arrow-down-s-line" />}
            </button>

            {showBulkDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowBulkDropdown(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-background-100 rounded-lg border border-background-200 shadow-lg z-20 py-1">
                  {(['pending', 'reviewed', 'accepted', 'rejected'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleBulkUpdate(status)}
                      disabled={bulkUpdating}
                      className="w-full px-4 py-2 text-sm text-left hover:bg-background-50 dark:hover:bg-background-200 transition-colors flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                    >
                      <span className={`w-2 h-2 rounded-full ${
                        status === 'pending' ? 'bg-yellow-500' :
                        status === 'reviewed' ? 'bg-blue-500' :
                        status === 'accepted' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      {statusLabels[status]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Bulk Msg */}
      {bulkMsg && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
          bulkMsg.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center gap-2">
            <i className={`${bulkMsg.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'} text-base`} />
            {bulkMsg.text}
          </div>
        </div>
      )}

      {/* Applications List */}
      {loading ? (
        <div className="text-center py-12 bg-background-50 dark:bg-background-100 rounded-xl border border-background-200">
          <div className="animate-pulse text-sm text-foreground-500">Başvurular yükleniyor...</div>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-background-50 dark:bg-background-100 rounded-xl border border-background-200">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3">
            <i className="ri-error-warning-line text-xl text-red-600 dark:text-red-400" />
          </div>
          <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>
          <button onClick={fetchApplications} className="px-4 py-2 text-sm font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors whitespace-nowrap">
            <i className="ri-refresh-line mr-1.5" />Tekrar Dene
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-background-50 dark:bg-background-100 rounded-xl border border-background-200">
          <div className="w-12 h-12 mx-auto rounded-full bg-background-100 dark:bg-background-200 flex items-center justify-center mb-3">
            <i className="ri-file-search-line text-xl text-foreground-400" />
          </div>
          <p className="text-sm text-foreground-500">
            {statusFilter !== 'all' || search.trim()
              ? 'Filtrelere uygun başvuru bulunamadı.'
              : 'Henüz hiç başvuru yapılmamış.'}
          </p>
        </div>
      ) : (
        <div className="bg-background-50 dark:bg-background-100 rounded-xl border border-background-200 overflow-hidden">
          {/* Select All Row */}
          <div className="px-4 py-2.5 border-b border-background-200 bg-background-100/50 dark:bg-background-50 flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-background-300 text-primary-500 focus:ring-primary-400 cursor-pointer"
              />
              <span className="text-xs font-medium text-foreground-500">
                {allFilteredSelected ? 'Seçimi Kaldır' : 'Tümünü Seç'} ({filtered.length})
              </span>
            </label>
          </div>

          <div className="divide-y divide-background-100 dark:divide-background-200">
            {filtered.map((app) => (
              <div key={app.id} className="px-4 py-3.5 hover:bg-background-50 dark:hover:bg-background-50/50 transition-colors">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(app.id)}
                    onChange={() => toggleSelect(app.id)}
                    className="w-4 h-4 rounded border-background-300 text-primary-500 focus:ring-primary-400 cursor-pointer mt-0.5 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground-950">{app.candidate_name}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[app.status] || ''}`}>
                          {statusLabels[app.status] || app.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-foreground-400">
                          {new Date(app.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-foreground-500 mb-1.5">
                      <i className="ri-briefcase-line mr-1" />{app.job_title}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-500 mb-1.5">
                      {app.candidate_email && (
                        <a href={`mailto:${app.candidate_email}`} className="text-primary-600 hover:underline">
                          <i className="ri-mail-line mr-1" />{app.candidate_email}
                        </a>
                      )}
                      {app.candidate_phone && (
                        <a href={`tel:${app.candidate_phone}`} className="hover:underline">
                          <i className="ri-phone-line mr-1" />{app.candidate_phone}
                        </a>
                      )}
                      {app.cv_url && (
                        <a
                          href={app.cv_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline font-medium"
                        >
                          <i className="ri-file-download-line mr-1" />CV indir
                        </a>
                      )}
                    </div>
                    {app.cover_letter && (
                      <p className="text-xs text-foreground-600 bg-background-100 dark:bg-background-50 rounded-lg p-2 mb-2 line-clamp-2">
                        {app.cover_letter}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleUpdateStatus(app.id, 'reviewed')}
                        disabled={updatingId === app.id || app.status === 'reviewed'}
                        className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {updatingId === app.id ? <i className="ri-loader-4-line animate-spin" /> : 'İncele'}
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(app.id, 'accepted')}
                        disabled={updatingId === app.id || app.status === 'accepted'}
                        className="px-2.5 py-1 text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {updatingId === app.id ? <i className="ri-loader-4-line animate-spin" /> : 'Kabul Et'}
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(app.id, 'rejected')}
                        disabled={updatingId === app.id || app.status === 'rejected'}
                        className="px-2.5 py-1 text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {updatingId === app.id ? <i className="ri-loader-4-line animate-spin" /> : 'Reddet'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {!loading && !error && applications.length > 0 && (
        <p className="text-xs text-foreground-400 mt-3">
          Toplam {applications.length} başvuru
          {statusFilter !== 'all' && ` · ${filtered.length} tanesi "${statusLabels[statusFilter]}" durumunda`}
          {search.trim() && ` · "${search}" ile filtrelendi`}
        </p>
      )}
    </div>
  );
}