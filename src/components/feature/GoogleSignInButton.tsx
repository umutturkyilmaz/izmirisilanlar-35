import { useEffect, useRef, useState } from 'react';
import { GOOGLE_CLIENT_ID } from '@/lib/site';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: Record<string, unknown>) => void;
          renderButton: (el: HTMLElement, cfg: Record<string, unknown>) => void;
        };
      };
    };
  }
}

type Props = {
  onCredential: (credential: string) => void | Promise<void>;
  disabled?: boolean;
};

export default function GoogleSignInButton({ onCredential, disabled }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const existing = document.querySelector('script[data-google-gis]');
    if (existing) {
      setReady(true);
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.dataset.googleGis = '1';
    s.onload = () => setReady(true);
    s.onerror = () => setErr('Google script yüklenemedi');
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (!ready || !GOOGLE_CLIENT_ID || !ref.current || disabled) return;
    try {
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (resp: { credential?: string }) => {
          if (resp.credential) void onCredential(resp.credential);
        },
      });
      ref.current.innerHTML = '';
      window.google?.accounts.id.renderButton(ref.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
        locale: 'tr',
      });
    } catch {
      setErr('Google butonu hazırlanamadı');
    }
  }, [ready, disabled, onCredential]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className="w-full">
      {err && <p className="text-xs text-red-600 mb-2">{err}</p>}
      <div ref={ref} className="flex justify-center min-h-[44px]" />
    </div>
  );
}
