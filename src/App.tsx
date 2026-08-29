import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./router";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { AuthProvider } from "@/hooks/useAuth";
import CookieBanner from "@/components/feature/CookieBanner";
import ConfigBanner from "@/components/feature/ConfigBanner";
import ErrorBoundary from "@/components/feature/ErrorBoundary";
import { useEffect } from "react";
import { expireOutdatedJobs } from "@/lib/expireJobs";

function JobExpiryRunner() {
  useEffect(() => {
    expireOutdatedJobs();
  }, []);
  return null;
}

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <ErrorBoundary>
          <BrowserRouter basename={__BASE_PATH__}>
            <JobExpiryRunner />
            <AppRoutes />
            <CookieBanner />
            <ConfigBanner />
          </BrowserRouter>
        </ErrorBoundary>
      </AuthProvider>
    </I18nextProvider>
  );
}

export default App;
