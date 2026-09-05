import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { api } from '@/lib/api';
import DocumentHead from '@/components/feature/DocumentHead';

export default function EmailVerifyPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Doğrulama bağlantısı eksik.');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await api<{ message?: string }>('/api/auth/verify-email', {
          method: 'POST',
          body: { token },
          auth: false,
        });
        if (cancelled) return;
        setStatus('ok');
        setMessage(data.message || 'E-posta adresiniz doğrulandı.');
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Doğrulama başarısız');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col">
      <DocumentHead title="E-posta doğrulama" path="/email-dogrula" />
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full rounded-2xl border border-background-200 bg-background-50 p-8 text-center">
          {status === 'loading' && (
            <p className="text-sm text-foreground-600">
              <i className="ri-loader-4-line animate-spin mr-2" />
              Doğrulanıyor...
            </p>
          )}
          {status === 'ok' && (
            <>
              <i className="ri-checkbox-circle-line text-4xl text-green-600 mb-3" />
              <h1 className="font-heading font-bold text-xl mb-2">Doğrulandı</h1>
              <p className="text-sm text-foreground-600 mb-6">{message}</p>
              <Link to="/giris" className="inline-flex px-5 py-2.5 bg-primary-500 text-white text-sm rounded-lg">
                Giriş yap
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <i className="ri-error-warning-line text-4xl text-red-500 mb-3" />
              <h1 className="font-heading font-bold text-xl mb-2">Doğrulama başarısız</h1>
              <p className="text-sm text-foreground-600 mb-6">{message}</p>
              <Link to="/giris" className="text-sm text-primary-600 hover:underline">
                Giriş sayfasına dön
              </Link>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
