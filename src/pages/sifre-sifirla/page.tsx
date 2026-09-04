import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { api } from '@/lib/api';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setMsg({ type: 'err', text: 'Şifre en az 6 karakter olmalı.' });
      return;
    }
    if (password !== password2) {
      setMsg({ type: 'err', text: 'Şifreler eşleşmiyor.' });
      return;
    }
    if (!token) {
      setMsg({ type: 'err', text: 'Geçersiz bağlantı.' });
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const data = await api<{ message?: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: { token, password },
        auth: false,
      });
      setMsg({ type: 'ok', text: data.message || 'Şifre güncellendi.' });
      setTimeout(() => navigate('/giris'), 1500);
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'İşlem başarısız' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-md bg-background-50 dark:bg-background-100 rounded-2xl border border-background-200 p-6 md:p-8">
          <h1 className="font-heading font-bold text-xl text-foreground-950 mb-2">Yeni şifre belirle</h1>
          <p className="text-sm text-foreground-600 mb-6">E-postadaki bağlantı ile geldiniz. Yeni şifrenizi yazın.</p>
          {!token && (
            <p className="text-sm text-red-600 mb-4">
              Token yok. <Link to="/sifremi-unuttum" className="underline">Şifremi unuttum</Link> sayfasından yeniden
              isteyin.
            </p>
          )}
          {msg && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                msg.type === 'ok'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {msg.text}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Yeni şifre</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-background-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Şifre tekrar</label>
              <input
                type="password"
                required
                minLength={6}
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-background-200 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !token}
              className="w-full py-2.5 rounded-lg bg-primary-500 text-white text-sm font-medium disabled:opacity-60"
            >
              {loading ? 'Kaydediliyor...' : 'Şifreyi güncelle'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
