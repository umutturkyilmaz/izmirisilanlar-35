import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { Link } from 'react-router-dom';

export default function ProfileRedirect() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center text-sm text-foreground-500">Yükleniyor...</main>
        <Footer />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-sm text-foreground-600 mb-4">Profil için giriş yapın.</p>
            <Link to="/giris" className="px-5 py-2.5 bg-primary-600 text-white text-sm rounded-lg font-medium">
              Giriş Yap
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (profile.role === 'employer') return <Navigate to="/profil/isveren" replace />;
  if (profile.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/profil/aday" replace />;
}
