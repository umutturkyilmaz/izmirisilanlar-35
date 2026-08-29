import { useState, useEffect, useCallback, useRef } from 'react';
import supabase from '@/lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ApplicationRow {
  id: string;
  job_id: string;
  candidate_id: string;
  cover_letter: string | null;
  cv_url: string | null;
  status: string;
  created_at: string;
}

interface JobRow {
  id: string;
  title: string;
  company_name: string;
  city: string;
  sector: string;
  job_type: string;
  experience_level: string;
  salary_min: number | null;
  salary_max: number | null;
  status: string;
  created_at: string;
}

interface ProfileRow {
  id: string;
  role: string;
  full_name: string | null;
  company_name: string | null;
  city: string | null;
}

interface DailyCount {
  date: string;
  count: number;
}

interface SectorCount {
  sector: string;
  count: number;
}

interface CityCount {
  city: string;
  count: number;
}

interface StatusCount {
  status: string;
  count: number;
}

interface RecentApp {
  id: string;
  candidate_name: string;
  job_title: string;
  company_name: string;
  status: string;
  created_at: string;
}

export default function DashboardSection() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Raw data
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);

  // Computed stats
  const [dailyApps, setDailyApps] = useState<DailyCount[]>([]);
  const [sectorDist, setSectorDist] = useState<SectorCount[]>([]);
  const [cityDist, setCityDist] = useState<CityCount[]>([]);
  const [statusDist, setStatusDist] = useState<StatusCount[]>([]);
  const [recentApps, setRecentApps] = useState<RecentApp[]>([]);

  // PDF Export
  const [exportPeriod, setExportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [exportLoading, setExportLoading] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Summary
  const [summary, setSummary] = useState({
    totalJobs: 0,
    totalApps: 0,
    totalEmployers: 0,
    totalCandidates: 0,
    activeJobs: 0,
    pendingJobs: 0,
    todayApps: 0,
    weekApps: 0,
    monthApps: 0,
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [appsRes, jobsRes, profilesRes] = await Promise.all([
        supabase.from('applications').select('*').order('created_at', { ascending: false }),
        supabase.from('jobs').select('*'),
        supabase.from('profiles').select('id, role, full_name, company_name, city'),
      ]);

      if (appsRes.error) throw appsRes.error;
      if (jobsRes.error) throw jobsRes.error;
      if (profilesRes.error) throw profilesRes.error;

      const appsData: ApplicationRow[] = appsRes.data || [];
      const jobsData: JobRow[] = jobsRes.data || [];
      const profilesData: ProfileRow[] = profilesRes.data || [];

      setApplications(appsData);
      setJobs(jobsData);

      // --- Summary ---
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      setSummary({
        totalJobs: jobsData.length,
        totalApps: appsData.length,
        totalEmployers: profilesData.filter((p) => p.role === 'employer').length,
        totalCandidates: profilesData.filter((p) => p.role === 'candidate').length,
        activeJobs: jobsData.filter((j) => j.status === 'active').length,
        pendingJobs: jobsData.filter((j) => j.status === 'pending').length,
        todayApps: appsData.filter((a) => a.created_at >= todayStart).length,
        weekApps: appsData.filter((a) => a.created_at >= weekAgo).length,
        monthApps: appsData.filter((a) => a.created_at >= monthAgo).length,
      });

      // --- Daily Applications (last 30 days) ---
      const dailyMap: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const key = `${d.getDate()}/${d.getMonth() + 1}`;
        dailyMap[key] = 0;
      }
      appsData.forEach((a) => {
        const d = new Date(a.created_at);
        const key = `${d.getDate()}/${d.getMonth() + 1}`;
        if (dailyMap[key] !== undefined) dailyMap[key]++;
      });
      const dailyArr: DailyCount[] = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));
      setDailyApps(dailyArr);

      // --- Sector Distribution (from jobs) ---
      const sectorMap: Record<string, number> = {};
      jobsData.forEach((j) => {
        const s = j.sector || 'Diğer';
        sectorMap[s] = (sectorMap[s] || 0) + 1;
      });
      const sectorArr: SectorCount[] = Object.entries(sectorMap)
        .map(([sector, count]) => ({ sector, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
      setSectorDist(sectorArr);

      // --- City Distribution (from jobs) ---
      const cityMap: Record<string, number> = {};
      jobsData.forEach((j) => {
        const c = j.city || 'Belirtilmemiş';
        cityMap[c] = (cityMap[c] || 0) + 1;
      });
      const cityArr: CityCount[] = Object.entries(cityMap)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      setCityDist(cityArr);

      // --- Application Status Distribution ---
      const statusMap: Record<string, number> = {};
      appsData.forEach((a) => {
        const s = a.status || 'pending';
        statusMap[s] = (statusMap[s] || 0) + 1;
      });
      const statusArr: StatusCount[] = Object.entries(statusMap).map(([status, count]) => ({ status, count }));
      setStatusDist(statusArr);

      // --- Recent Applications (last 10) ---
      const profilesMap: Record<string, ProfileRow> = {};
      profilesData.forEach((p) => { profilesMap[p.id] = p; });
      const jobsMap: Record<string, JobRow> = {};
      jobsData.forEach((j) => { jobsMap[j.id] = j; });

      const recent: RecentApp[] = appsData.slice(0, 10).map((a) => ({
        id: a.id,
        candidate_name: profilesMap[a.candidate_id]?.full_name || 'Bilinmiyor',
        job_title: jobsMap[a.job_id]?.title || 'Silinmiş İlan',
        company_name: jobsMap[a.job_id]?.company_name || '—',
        status: a.status,
        created_at: a.created_at,
      }));
      setRecentApps(recent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İstatistikler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Close export dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setExportDropdownOpen(false);
      }
    };
    if (exportDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [exportDropdownOpen]);

  const generatePDF = async () => {
    setExportLoading(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let y = margin;

      // Colors
      const primaryColor = [249, 115, 22] as [number, number, number];
      const darkColor = [30, 30, 30] as [number, number, number];
      const grayColor = [100, 100, 100] as [number, number, number];
      const lightGray = [240, 240, 240] as [number, number, number];

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(...primaryColor);
      doc.text('Izmir Is Ilanlari 35', margin, y);
      y += 8;
      doc.setFontSize(12);
      doc.setTextColor(...grayColor);
      doc.text('Istatistik Raporu', margin, y);
      y += 5;
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;

      // Period & Date
      const now = new Date();
      const periodLabels: Record<string, string> = {
        daily: `Gunluk Rapor - ${now.toLocaleDateString('tr-TR')}`,
        weekly: `Haftalik Rapor - ${new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR')} / ${now.toLocaleDateString('tr-TR')}`,
        monthly: `Aylik Rapor - ${new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR')} / ${now.toLocaleDateString('tr-TR')}`,
      };
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkColor);
      doc.text(periodLabels[exportPeriod], margin, y);
      y += 12;

      // Filter data by period
      const getPeriodStart = (): string => {
        if (exportPeriod === 'daily') return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        if (exportPeriod === 'weekly') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      };
      const periodStart = getPeriodStart();
      const periodApps = applications.filter((a) => a.created_at >= periodStart);
      const periodJobs = jobs.filter((j) => j.created_at >= periodStart);

      // --- Summary Stats ---
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkColor);
      doc.text('Ozet Istatistikler', margin, y);
      y += 8;

      const summaryRows = [
        ['Toplam Ilan (Donem)', String(periodJobs.length)],
        ['Toplam Ilan (Genel)', String(summary.totalJobs)],
        ['Aktif Ilan', String(summary.activeJobs)],
        ['Toplam Basvuru (Donem)', String(periodApps.length)],
        ['Toplam Basvuru (Genel)', String(summary.totalApps)],
        ['Isveren Sayisi', String(summary.totalEmployers)],
        ['Aday Sayisi', String(summary.totalCandidates)],
      ];

      autoTable(doc, {
        startY: y,
        head: [['Metrik', 'Deger']],
        body: summaryRows,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: lightGray },
        tableWidth: pageWidth - 2 * margin,
      });
      y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || y) + 10;

      // --- Sector Distribution ---
      if (sectorDist.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...darkColor);
        doc.text('Sektor Dagilimi', margin, y);
        y += 6;

        const sectorRows = sectorDist.map((s) => [s.sector, String(s.count)]);
        autoTable(doc, {
          startY: y,
          head: [['Sektor', 'Ilan Sayisi']],
          body: sectorRows,
          margin: { left: margin, right: margin },
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: lightGray },
          tableWidth: pageWidth - 2 * margin,
        });
        y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || y) + 10;
      }

      // --- City Distribution ---
      if (cityDist.length > 0) {
        // Check if we need a new page
        if (y > 230) { doc.addPage(); y = margin; }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...darkColor);
        doc.text('Sehir Dagilimi', margin, y);
        y += 6;

        const cityRows = cityDist.map((c) => [c.city, String(c.count)]);
        autoTable(doc, {
          startY: y,
          head: [['Sehir', 'Ilan Sayisi']],
          body: cityRows,
          margin: { left: margin, right: margin },
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: lightGray },
          tableWidth: pageWidth - 2 * margin,
        });
        y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || y) + 10;
      }

      // --- Application Status Distribution ---
      if (statusDist.length > 0) {
        if (y > 230) { doc.addPage(); y = margin; }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...darkColor);
        doc.text('Basvuru Durum Dagilimi', margin, y);
        y += 6;

        const statusRows = statusDist.map((s) => {
          const pct = Math.round((s.count / (totalStatus || 1)) * 100);
          return [statusLabel[s.status] || s.status, String(s.count), `%${pct}`];
        });
        autoTable(doc, {
          startY: y,
          head: [['Durum', 'Sayi', 'Oran']],
          body: statusRows,
          margin: { left: margin, right: margin },
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: lightGray },
          tableWidth: pageWidth - 2 * margin,
        });
        y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || y) + 10;
      }

      // --- Recent Applications ---
      const periodRecentApps = recentApps.filter((a) => a.created_at >= periodStart);
      if (periodRecentApps.length > 0) {
        if (y > 220) { doc.addPage(); y = margin; }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...darkColor);
        doc.text('Son Basvurular', margin, y);
        y += 6;

        const appRows = periodRecentApps.map((a) => [
          a.candidate_name,
          a.job_title.length > 25 ? a.job_title.slice(0, 25) + '...' : a.job_title,
          statusLabel[a.status] || 'Bekliyor',
          new Date(a.created_at).toLocaleDateString('tr-TR'),
        ]);
        autoTable(doc, {
          startY: y,
          head: [['Aday', 'Ilan', 'Durum', 'Tarih']],
          body: appRows,
          margin: { left: margin, right: margin },
          styles: { fontSize: 8, cellPadding: 2.5 },
          headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: lightGray },
          tableWidth: pageWidth - 2 * margin,
        });
        y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || y) + 10;
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(...grayColor);
      doc.text(`Izmir Is Ilanlari 35 - ${now.toLocaleDateString('tr-TR')} ${now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`, margin, 287);

      doc.save(`izmir-is-ilanlari-rapor-${exportPeriod}-${now.toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setExportLoading(false);
      setExportDropdownOpen(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const statusLabel: Record<string, string> = {
    pending: 'Bekliyor',
    reviewed: 'İncelendi',
    accepted: 'Kabul',
    rejected: 'Red',
  };

  const statusBarColor: Record<string, string> = {
    pending: 'bg-yellow-400',
    reviewed: 'bg-blue-400',
    accepted: 'bg-green-400',
    rejected: 'bg-red-400',
  };

  const statusDotColor: Record<string, string> = {
    pending: 'bg-yellow-500',
    reviewed: 'bg-blue-500',
    accepted: 'bg-green-500',
    rejected: 'bg-red-500',
  };

  const maxDaily = Math.max(1, ...dailyApps.map((d) => d.count));
  const maxSector = Math.max(1, ...sectorDist.map((s) => s.count));
  const maxCity = Math.max(1, ...cityDist.map((c) => c.count));
  const totalStatus = statusDist.reduce((sum, s) => sum + s.count, 0) || 1;

  if (loading) {
    return (
      <div className="bg-white dark:bg-background-100 rounded-xl border border-background-200 p-12 text-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-background-100 dark:bg-background-200" />
          <div className="h-4 w-36 bg-background-100 dark:bg-background-200 rounded" />
          <div className="h-3 w-56 bg-background-100 dark:bg-background-200 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-background-100 rounded-xl border border-background-200 p-12 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3">
          <i className="ri-error-warning-line text-xl text-red-600 dark:text-red-400" />
        </div>
        <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>
        <button onClick={fetchDashboardData} className="px-4 py-2 text-sm font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors whitespace-nowrap">
          <i className="ri-refresh-line mr-1.5" />Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===== HEADER WITH EXPORT BUTTON ===== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className="ri-bar-chart-box-line text-primary-500 text-lg" />
          <h2 className="font-heading font-bold text-lg text-foreground-950">Istatistik Dashboard</h2>
        </div>
        <div className="relative" ref={exportDropdownRef}>
          <button
            onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
            disabled={exportLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors whitespace-nowrap disabled:opacity-60"
          >
            {exportLoading ? (
              <>
                <i className="ri-loader-4-line animate-spin" />
                Hazirlaniyor...
              </>
            ) : (
              <>
                <i className="ri-download-line" />
                PDF Rapor Indir
                <i className={`ri-arrow-down-s-line text-xs transition-transform ${exportDropdownOpen ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>
          {exportDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-background-100 rounded-lg border border-background-200 shadow-lg z-50 py-1">
              <button
                onClick={() => { setExportPeriod('daily'); generatePDF(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground-700 hover:bg-background-50 dark:hover:bg-background-200 transition-colors whitespace-nowrap"
              >
                <i className="ri-calendar-line text-primary-500" />
                Gunluk Rapor
              </button>
              <button
                onClick={() => { setExportPeriod('weekly'); generatePDF(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground-700 hover:bg-background-50 dark:hover:bg-background-200 transition-colors whitespace-nowrap"
              >
                <i className="ri-calendar-2-line text-primary-500" />
                Haftalik Rapor
              </button>
              <button
                onClick={() => { setExportPeriod('monthly'); generatePDF(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground-700 hover:bg-background-50 dark:hover:bg-background-200 transition-colors whitespace-nowrap"
              >
                <i className="ri-calendar-check-line text-primary-500" />
                Aylik Rapor
              </button>
            </div>
          )}
        </div>
      </div>
      {/* ===== SUMMARY STAT CARDS ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-background-200 bg-white dark:bg-background-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <i className="ri-briefcase-line text-sm text-primary-600 dark:text-primary-400" />
            </div>
            <span className="text-xs font-medium text-foreground-500">Toplam İlan</span>
          </div>
          <p className="text-2xl font-bold text-foreground-950">{summary.totalJobs}</p>
          <p className="text-xs text-foreground-400 mt-1">
            <span className="text-green-600 font-medium">{summary.activeJobs}</span> aktif
          </p>
        </div>

        <div className="p-4 rounded-xl border border-background-200 bg-white dark:bg-background-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
              <i className="ri-file-list-3-line text-sm text-accent-600 dark:text-accent-400" />
            </div>
            <span className="text-xs font-medium text-foreground-500">Toplam Başvuru</span>
          </div>
          <p className="text-2xl font-bold text-foreground-950">{summary.totalApps}</p>
          <p className="text-xs text-foreground-400 mt-1">
            <span className="text-green-600 font-medium">{summary.todayApps}</span> bugün
          </p>
        </div>

        <div className="p-4 rounded-xl border border-background-200 bg-white dark:bg-background-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center">
              <i className="ri-building-line text-sm text-secondary-600 dark:text-secondary-400" />
            </div>
            <span className="text-xs font-medium text-foreground-500">İşveren</span>
          </div>
          <p className="text-2xl font-bold text-foreground-950">{summary.totalEmployers}</p>
          <p className="text-xs text-foreground-400 mt-1">kayıtlı şirket</p>
        </div>

        <div className="p-4 rounded-xl border border-background-200 bg-white dark:bg-background-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <i className="ri-user-line text-sm text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs font-medium text-foreground-500">Aday</span>
          </div>
          <p className="text-2xl font-bold text-foreground-950">{summary.totalCandidates}</p>
          <p className="text-xs text-foreground-400 mt-1">kayıtlı kullanıcı</p>
        </div>
      </div>

      {/* ===== SECONDARY STATS ROW ===== */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl border border-background-200 bg-white dark:bg-background-100 flex items-center justify-between">
          <span className="text-sm text-foreground-600">Bugünkü Başvuru</span>
          <span className="text-lg font-bold text-foreground-950">{summary.todayApps}</span>
        </div>
        <div className="p-3 rounded-xl border border-background-200 bg-white dark:bg-background-100 flex items-center justify-between">
          <span className="text-sm text-foreground-600">Bu Hafta</span>
          <span className="text-lg font-bold text-foreground-950">{summary.weekApps}</span>
        </div>
        <div className="p-3 rounded-xl border border-background-200 bg-white dark:bg-background-100 flex items-center justify-between">
          <span className="text-sm text-foreground-600">Bu Ay</span>
          <span className="text-lg font-bold text-foreground-950">{summary.monthApps}</span>
        </div>
      </div>

      {/* ===== CHARTS GRID ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* --- Daily Application Chart --- */}
        <div className="bg-white dark:bg-background-100 rounded-xl border border-background-200 p-5">
          <h3 className="font-heading font-semibold text-sm text-foreground-950 mb-4 flex items-center gap-2">
            <i className="ri-bar-chart-line text-accent-500" />
            Günlük Başvuru Sayısı (Son 30 Gün)
          </h3>
          <div className="flex items-end gap-1 h-48">
            {dailyApps.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full">
                <div className="w-full relative flex flex-col items-center" style={{ height: '100%' }}>
                  <div
                    className="w-full max-w-[20px] rounded-t-sm bg-accent-400/70 dark:bg-accent-500/60 hover:bg-accent-500 dark:hover:bg-accent-400 transition-colors cursor-pointer"
                    style={{ height: `${(d.count / maxDaily) * 100}%`, minHeight: d.count > 0 ? '4px' : '0px' }}
                    title={`${d.date}: ${d.count} başvuru`}
                  />
                </div>
                {dailyApps.length <= 15 ? (
                  <span className="text-[10px] text-foreground-400 mt-1 whitespace-nowrap">{d.date}</span>
                ) : (
                  dailyApps.findIndex((x) => x.date === d.date) % 3 === 0 && (
                    <span className="text-[10px] text-foreground-400 mt-1 whitespace-nowrap">{d.date}</span>
                  )
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-background-100 dark:border-background-200">
            <span className="text-xs text-foreground-400">En yüksek: {maxDaily} başvuru</span>
            <span className="text-xs text-foreground-400">Toplam: {summary.monthApps}</span>
          </div>
        </div>

        {/* --- Sector Distribution --- */}
        <div className="bg-white dark:bg-background-100 rounded-xl border border-background-200 p-5">
          <h3 className="font-heading font-semibold text-sm text-foreground-950 mb-4 flex items-center gap-2">
            <i className="ri-pie-chart-line text-primary-500" />
            En Popüler Sektörler
          </h3>
          <div className="space-y-3">
            {sectorDist.length === 0 ? (
              <p className="text-sm text-foreground-400 text-center py-8">Henüz veri yok</p>
            ) : (
              sectorDist.map((s, idx) => (
                <div key={s.sector}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground-700 whitespace-nowrap">{s.sector}</span>
                    <span className="text-xs text-foreground-500 ml-2">{s.count}</span>
                  </div>
                  <div className="w-full h-2.5 bg-background-100 dark:bg-background-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(s.count / maxSector) * 100}%`,
                        backgroundColor: [
                          '#f97316', '#eab308', '#22c55e', '#14b8a6',
                          '#06b6d4', '#8b5cf6', '#ec4899', '#f43f5e',
                        ][idx % 8],
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* --- City Distribution --- */}
        <div className="bg-white dark:bg-background-100 rounded-xl border border-background-200 p-5">
          <h3 className="font-heading font-semibold text-sm text-foreground-950 mb-4 flex items-center gap-2">
            <i className="ri-map-pin-line text-secondary-500" />
            İlanların Şehirlere Göre Dağılımı
          </h3>
          <div className="space-y-3">
            {cityDist.length === 0 ? (
              <p className="text-sm text-foreground-400 text-center py-8">Henüz veri yok</p>
            ) : (
              cityDist.map((c, idx) => (
                <div key={c.city}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground-700 whitespace-nowrap">{c.city}</span>
                    <span className="text-xs text-foreground-500 ml-2">{c.count}</span>
                  </div>
                  <div className="w-full h-2.5 bg-background-100 dark:bg-background-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(c.count / maxCity) * 100}%`,
                        backgroundColor: [
                          '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
                          '#ec4899', '#f43f5e', '#e11d48', '#fb923c',
                          '#fbbf24', '#a3e635',
                        ][idx % 10],
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* --- Application Status Distribution --- */}
        <div className="bg-white dark:bg-background-100 rounded-xl border border-background-200 p-5">
          <h3 className="font-heading font-semibold text-sm text-foreground-950 mb-4 flex items-center gap-2">
            <i className="ri-donut-chart-line text-green-500" />
            Başvuru Durum Dağılımı
          </h3>
          {statusDist.length === 0 ? (
            <p className="text-sm text-foreground-400 text-center py-8">Henüz başvuru yok</p>
          ) : (
            <div className="space-y-3">
              {statusDist.map((s) => {
                const pct = Math.round((s.count / totalStatus) * 100);
                return (
                  <div key={s.status}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full inline-block ${statusDotColor[s.status] || 'bg-foreground-400'}`} />
                        <span className="text-xs font-medium text-foreground-700 whitespace-nowrap">
                          {statusLabel[s.status] || s.status}
                        </span>
                      </div>
                      <span className="text-xs text-foreground-500">{s.count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-background-100 dark:bg-background-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${statusBarColor[s.status] || 'bg-foreground-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4 pt-3 border-t border-background-100 dark:border-background-200">
            <div className="flex flex-wrap gap-3">
              {statusDist.map((s) => (
                <div key={s.status} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${statusDotColor[s.status] || 'bg-foreground-400'}`} />
                  <span className="text-[11px] text-foreground-500">{statusLabel[s.status] || s.status}: {s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== RECENT APPLICATIONS FEED ===== */}
      <div className="bg-white dark:bg-background-100 rounded-xl border border-background-200 p-5">
        <h3 className="font-heading font-semibold text-sm text-foreground-950 mb-4 flex items-center gap-2">
          <i className="ri-history-line text-foreground-500" />
          Son Başvurular
        </h3>
        {recentApps.length === 0 ? (
          <p className="text-sm text-foreground-400 text-center py-8">Henüz başvuru yok</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-background-100 dark:border-background-200">
                  <th className="text-left px-3 py-2 text-xs font-semibold text-foreground-500 uppercase tracking-wider whitespace-nowrap">Aday</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-foreground-500 uppercase tracking-wider whitespace-nowrap">İlan</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-foreground-500 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Şirket</th>
                  <th className="text-center px-3 py-2 text-xs font-semibold text-foreground-500 uppercase tracking-wider whitespace-nowrap">Durum</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-foreground-500 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {recentApps.map((app) => (
                  <tr key={app.id} className="border-b border-background-50 dark:border-background-200/50 last:border-0 hover:bg-background-50 dark:hover:bg-background-50/50 transition-colors">
                    <td className="px-3 py-2.5">
                      <span className="text-sm font-medium text-foreground-900">{app.candidate_name}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-sm text-foreground-700 line-clamp-1">{app.job_title}</span>
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell">
                      <span className="text-xs text-foreground-500">{app.company_name}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                        app.status === 'accepted' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        app.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                        app.status === 'reviewed' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      }`}>
                        {statusLabel[app.status] || 'Bekliyor'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right hidden md:table-cell">
                      <span className="text-xs text-foreground-400 whitespace-nowrap">{formatDate(app.created_at)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}