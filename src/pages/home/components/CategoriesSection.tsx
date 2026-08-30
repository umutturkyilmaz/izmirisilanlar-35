import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';

interface Category {
  id: number;
  name: string;
  icon: string;
  sort_order: number;
}

export default function CategoriesSection() {
  const { t } = useTranslation('common');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await api<Category[]>('/api/categories', { auth: false });
        if (data) setCategories(data);
      } catch {
        // silent fail, keep empty
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <section className="py-14 md:py-20 bg-background-50 dark:bg-background-50">
      <div className="px-4 md:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="font-heading font-bold text-2xl md:text-3xl lg:text-4xl text-foreground-950 dark:text-foreground-950 mb-3">
            {t('categories.title')}
          </h2>
          <p className="text-sm md:text-base text-foreground-600 max-w-lg mx-auto">
            {t('categories.subtitle')}
          </p>
        </div>

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-background-100 rounded-xl p-4 md:p-5 border border-background-200 h-28 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/ilanlar?sector=${encodeURIComponent(cat.name)}`}
                className="group bg-background-100 dark:bg-background-100 rounded-xl p-4 md:p-5 border border-background-200 dark:border-background-200 hover:border-primary-300 hover:bg-primary-50/40 dark:hover:bg-primary-900/10 transition-all duration-300"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-3 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                  <i className={`${cat.icon} text-lg md:text-xl text-primary-600 dark:text-primary-400 group-hover:text-white`} />
                </div>
                <h3 className="font-heading font-semibold text-sm md:text-base text-foreground-950 dark:text-foreground-950 mb-1">
                  {cat.name}
                </h3>
                <p className="text-xs text-foreground-500">
                  {(cat as any).job_count?.toLocaleString('tr-TR') || 'Açık'} ilan
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}