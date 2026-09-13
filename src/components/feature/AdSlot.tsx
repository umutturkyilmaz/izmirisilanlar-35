import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export type AdPlacement = 'home' | 'jobs_list' | 'job_detail';

type PublicAd = {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  placement: AdPlacement;
  sort_order: number;
};

type Props = {
  placement: AdPlacement;
  className?: string;
};

export default function AdSlot({ placement, className = '' }: Props) {
  const [ads, setAds] = useState<PublicAd[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await api<PublicAd[]>(`/api/ads?placement=${encodeURIComponent(placement)}`, {
          auth: false,
        });
        if (!cancelled) setAds(rows || []);
      } catch {
        if (!cancelled) setAds([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [placement]);

  if (!ads.length) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {ads.map((ad) => (
        <a
          key={ad.id}
          href={ad.link_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block rounded-xl overflow-hidden border border-background-200 bg-background-50 dark:bg-background-100 hover:border-primary-300 transition-colors"
          aria-label={ad.title}
        >
          <img
            src={ad.image_url}
            alt={ad.title}
            className="w-full h-auto max-h-48 object-cover object-center"
            loading="lazy"
          />
          <div className="px-3 py-1.5 flex items-center justify-between gap-2">
            <span className="text-xs text-foreground-600 truncate">{ad.title}</span>
            <span className="text-[10px] uppercase tracking-wide text-foreground-400 shrink-0">Reklam</span>
          </div>
        </a>
      ))}
    </div>
  );
}
