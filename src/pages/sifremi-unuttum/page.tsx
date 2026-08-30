import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const data = await api<{ ok: boolean; message?: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: { email: email.trim() },
        auth: false,
      });
      setMsg({
        type: 'ok',
        text: data.message || 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Gelen kutusu ve spam klasörünü kontrol edin.',
      });
    } catch (err) {
      setMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'İstek gönderilemedi',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-md bg-background-50 dark:bg-background-100 rounded-2xl border border-background-200 p-6 md:p-8">
          <h1 className="font-heading font-bold text-xl text-foreground-950 mb-2">Şifremi Unuttum</h1>
          <p className="text-sm text-foreground-600 mb-6">
            Kayıtlı e-posta adresinizi yazın; sıfırlama bağlantısı gönderelim.
          </p>
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
              <label className="block text-sm font-medium text-foreground-700 mb-1.5">E-posta</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-background-200 bg-background-100 text-sm outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold disabled:opacity-60"
            >
              {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
            </button>
          </form>
          <p className="text-center text-sm text-foreground-600 mt-5">
            <Link to="/giris" className="text-primary-600 hover:underline">
              Girişe dön
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
