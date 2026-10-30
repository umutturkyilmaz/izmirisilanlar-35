import Navbar from "@/components/feature/Navbar";
import Footer from "@/components/feature/Footer";
import DocumentHead from "@/components/feature/DocumentHead";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function CvUploadPage() {
  const { t } = useTranslation("common");
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is candidate or has employer role but wants to upload CV
  const canUpload = user && (profile?.role === "candidate" || profile?.role === "employer");

  if (!canUpload) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t("auth.loginRequired")}</p>
        <Link to="/giris">{t("nav.login")}</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append("cv_file", cvFile![0]);
    formData.append("full_name", fullName);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("city", city);
    formData.append("position", position);
    formData.append("experience_level", experienceLevel);
    formData.append("education_level", educationLevel);
    if (portfolioUrl) {
      formData.append("portfolio_url", portfolioUrl);
    }

    try {
      const res = await fetch("/api/cv-upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        setSuccess(true);
        // Redirect to home or profile after 2 seconds
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        setError(data.error || "Bilinmeyen bir hata oluştu");
      }
    } catch (err) {
      setError("Bağlantı hatası, lütfen tekrar deneyin");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <DocumentHead title="CV Yükle" description="İzmir İş İlanları 35 - CV Ücretsiz Yükleme" path="/cv-yukle" />
      <Navbar />
      <main className="flex-1">
        <div className="px-4 md:px-6 lg:px-8 max-w-3xl mx-auto py-4 md:py-6">
          <div className="text-center mb-10">
            <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground-950 mb-3">
              {t("cvUpload.title")}
            </h1>
            <p className="text-sm md:text-base text-foreground-500 max-w-xl mx-auto">
              {t("cvUpload.subtitle")}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700">
              <p className="text-sm text-green-600">{t("cvUpload.success")}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground-600 mb-2">
                  {t("cvUpload.fullName")}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  required
                  placeholder={t("cvUpload.fullName")}
                  className="w-full rounded-xl border border-background-200 bg-white dark:bg-background-100 px-4 py-3 focus:outline-none focus:border-primary-500 dark:text-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-600 mb-2">
                  {t("cvUpload.email")}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder={t("cvUpload.email")}
                  className="w-full rounded-xl border border-background-200 bg-white dark:bg-background-100 px-4 py-3 focus:outline-none focus:border-primary-500 dark:text-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-600 mb-2">
                  {t("cvUpload.phone")}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder={t("cvUpload.phone")}
                  className="w-full rounded-xl border border-background-200 bg-white dark:bg-background-100 px-4 py-3 focus:outline-none focus:border-primary-500 dark:text-white transition-colors"
                  inputMode="tel"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-600 mb-2">
                  {t("cvUpload.city")}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  required
                  placeholder={t("cvUpload.city")}
                  className="w-full rounded-xl border border-background-200 bg-white dark:bg-background-100 px-4 py-3 focus:outline-none focus:border-primary-500 dark:text-white transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground-600 mb-2">
                  {t("cvUpload.position")}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="position"
                  required
                  placeholder={t("cvUpload.position")}
                  className="w-full rounded-xl border border-background-200 bg-white dark:bg-background-100 px-4 py-3 focus:outline-none focus:border-primary-500 dark:text-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-600 mb-2">
                  {t("cvUpload.experienceLevel")}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  name="experience_level"
                  required
                  className="w-full rounded-xl border border-background-200 bg-white dark:bg-background-100 px-4 py-3 focus:outline-none focus:border-primary-500 dark:text-white transition-colors"
                >
                  <option value="">{t("cvUpload.experienceLevel")}</option>
                  <option value="Junior (0-2 Yıl)">Junior (0-2 Yıl)</option>
                  <option value="Mid-Level (2-5 Yıl)">Mid-Level (2-5 Yıl)</option>
                  <option value="Senior (5+ Yıl)">Senior (5+ Yıl)</option>
                  <option value="Her Seviye">Her Seviye</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-600 mb-2">
                  {t("cvUpload.educationLevel")}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  name="education_level"
                  required
                  className="w-full rounded-xl border border-background-200 bg-white dark:bg-background-100 px-4 py-3 focus:outline-none focus:border-primary-500 dark:text-white transition-colors"
                >
                  <option value="">{t("cvUpload.educationLevel")}</option>
                  <option value="Lise">Lise</option>
                  <option value="Lisans">Lisans</option>
                  <option value="Yüksek Lisans">Yüksek Lisans</option>
                  <option value="Doktora">Doktora</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-600 mb-2">
                {t("cvUpload.portfolioUrl")}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                name="portfolio_url"
                placeholder={t("cvUpload.portfolioUrl")}
                className="w-full rounded-xl border border-background-200 bg-white dark:bg-background-100 px-4 py-3 focus:outline-none focus:border-primary-500 dark:text-white transition-colors"
                aria-label="Portfolyo / LinkedIn / GitHub URL'si"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground-600 mb-2">
                {t("cvUpload.cvFile")}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                name="cv_file"
                accept=".pdf,.doc,.docx"
                required
                className="w-full rounded-xl border border-background-200 bg-white dark:bg-background-100 px-4 py-3 cursor-pointer focus:outline-none focus:border-primary-500 dark:text-white transition-colors"
                aria-label="CV dosyası (PDF veya DOCX, max 5MB)"
              />
              <p className="text-xs text-foreground-400 mt-1">
                {t("cvUpload.fileRequired")} {t("cvUpload.fileType")} {t("cvUpload.fileSize")}
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full rounded-xl border transition-colors ${
                isSubmitting
                  ? "bg-primary-100 text-primary-700 cursor-not-allowed"
                  : "bg-primary-600 text-white hover:bg-primary-700 transition-colors"}
              `}
            >
              {isSubmitting ? "Yükleniyor..." : t("cvUpload.submit")}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
