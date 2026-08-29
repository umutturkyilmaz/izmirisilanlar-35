import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const KEY = 'cookie_consent_v1';

export default function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(KEY, 'accepted');
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] p-4 md:p-5">
      <div className="max-w-3xl mx-auto rounded-2xl border border-background-200 bg-background-50 dark:bg-background-100 shadow-lg p-4 md:p-5 flex flex-col sm:flex-row gap-3 sm:items-center">
        <p className="text-sm text-foreground-700 flex-1 leading-relaxed">
          Site oturum, güvenlik ve tercih çerezleri kullanır. Devam ederek{' '}
          <Link to="/gizlilik" className="text-primary-600 hover:underline">
            gizlilik politikasını
          </Link>{' '}
          ve{' '}
          <Link to="/kvkk" className="text-primary-600 hover:underline">
            KVKK metnini
          </Link>{' '}
          kabul etmiş olursunuz.
        </p>
        <button
          type="button"
          onClick={accept}
          className="shrink-0 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold"
        >
          Anladım
        </button>
      </div>
    </div>
  );
}
