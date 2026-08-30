import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

interface FavoriteJob {
  id: string;
  job_id: string;
  title: string;
  company_name: string;
  city: string;
  sector: string;
  job_type: string;
  salary_min: number | null;
  salary_max: number | null;
  created_at: string;
}

export default function FavoritesPage() {
  const { user, loading } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteJob[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setDataLoading(false);
      return;
    }
    const fetchFavorites = async () => {
      setDataLoading(true);
      try {
        const data = await api<FavoriteJob[]>('/api/favorites');
        setFavorites(data || []);
      } catch {
        // silent
      } finally {
        setDataLoading(false);
      }
    };
    fetchFavorites();
  }, [user]);

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      await api(`/api/favorites/${favoriteId}`, { method: 'DELETE' });
      setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
    } catch {
      // silent
    }
  };

  const jobTypeLabels: Record<string, string> = {
    'tam-zamanli': 'Tam Zamanlı',
    'yari-zamanli': 'Yarı Zamanlı',
    'uzaktan': 'Uzaktan',
    'staj': 'Staj',
    'freelance': 'Freelance',
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

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <i className="ri-heart-line text-5xl text-foreground-300 mb-4 block" />
            <h1 className="font-heading font-bold text-2xl text-foreground-700 mb-2">Giriş Yapmalısınız</h1>
            <p className="text-sm text-foreground-500 mb-4">Favorilerinizi görüntülemek için lütfen giriş yapın.</p>
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
          <div className="mb-6">
            <h1 className="font-heading font-bold text-2xl md:text-3xl text-foreground-950">Favori İlanlarım</h1>
            <p className="text-sm text-foreground-500 mt-1">{favorites.length} favori ilan</p>
          </div>

          {dataLoading ? (
            <div className="text-center py-12 text-sm text-foreground-500 animate-pulse">Favorileriniz yükleniyor...</div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-16 bg-background-50 dark:bg-background-100 rounded-xl border border-background-200 dark:border-background-200">
              <i className="ri-heart-line text-5xl text-foreground-300 mb-4 block" />
              <h2 className="font-heading font-semibold text-lg text-foreground-700 mb-2">Henüz Favori Yok</h2>
              <p className="text-sm text-foreground-500 mb-4">Beğendiğiniz ilanları favorilere ekleyin, buradan kolayca ulaşın.</p>
              <Link to="/ilanlar" className="px-5 py-2.5 bg-primary-500 text-white font-medium text-sm rounded-lg hover:bg-primary-600 transition-colors">
                İlanları Keşfedin
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {favorites.map((fav) => (
                <div key={fav.id} className="bg-background-50 dark:bg-background-100 rounded-xl border border-background-200 dark:border-background-200 p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <Link to={`/ilan/${fav.job_id}`} className="font-heading font-semibold text-sm md:text-base text-foreground-950 hover:text-primary-600 transition-colors">
                      {fav.title}
                    </Link>
                    <p className="text-xs text-foreground-500 mt-0.5">
                      {fav.company_name} · {fav.city} · {jobTypeLabels[fav.job_type] || fav.job_type}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 rounded-md text-xs bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-300">
                        {fav.sector}
                      </span>
                      {fav.salary_min && fav.salary_max && (
                        <span className="text-xs text-foreground-600">
                          {fav.salary_min.toLocaleString('tr-TR')} - {fav.salary_max.toLocaleString('tr-TR')} TL
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/ilan/${fav.job_id}`}
                      className="px-4 py-2 text-xs font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors whitespace-nowrap"
                    >
                      İncele
                    </Link>
                    <button
                      onClick={() => handleRemoveFavorite(fav.id)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <i className="ri-heart-fill" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}