import { Suspense, useEffect } from "react";
import { useNavigate, useRoutes, type NavigateFunction } from "react-router-dom";
import PageLoader from "../components/feature/PageLoader";
import ScrollToTop from "../components/feature/ScrollToTop";
import routes from "./config";

let navigateResolver: (navigate: ReturnType<typeof useNavigate>) => void;

declare global {
  interface Window {
    REACT_APP_NAVIGATE: ReturnType<typeof useNavigate>;
  }
}

export const navigatePromise = new Promise<NavigateFunction>((resolve) => {
  navigateResolver = resolve;
});

export function AppRoutes() {
  const element = useRoutes(routes);
  const navigate = useNavigate();

  useEffect(() => {
    window.REACT_APP_NAVIGATE = navigate;
    navigateResolver(window.REACT_APP_NAVIGATE);
  }, [navigate]);

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>{element}</Suspense>
    </>
  );
}
