import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background-50 dark:bg-background-50">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-6">
          <i className="ri-error-warning-line text-3xl text-primary-600 dark:text-primary-400" />
        </div>
        <h1 className="font-heading font-bold text-4xl md:text-5xl text-foreground-950 dark:text-foreground-950 mb-3">
          404
        </h1>
        <h2 className="font-heading font-semibold text-xl text-foreground-700 mb-2">
          Sayfa Bulunamadı
        </h2>
        <p className="text-sm text-foreground-500 mb-6">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-white font-medium text-sm rounded-lg hover:bg-primary-600 transition-colors"
        >
          <i className="ri-home-line" />
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}