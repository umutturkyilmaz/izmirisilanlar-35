import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import Home from "../pages/home/page";
import { RequireAuth } from "../components/feature/RequireAuth";

const NotFound = lazy(() => import("../pages/NotFound"));
const JobListings = lazy(() => import("../pages/ilanlar/page"));
const JobDetail = lazy(() => import("../pages/ilanlar/detail/page"));
const EditJob = lazy(() => import("../pages/ilanlar/edit/page"));
const Login = lazy(() => import("../pages/giris/page"));
const Register = lazy(() => import("../pages/kayit/page"));
const About = lazy(() => import("../pages/hakkimizda/page"));
const Contact = lazy(() => import("../pages/iletisim/page"));
const PostJob = lazy(() => import("../pages/ilan-ekle/page"));
const CandidateProfile = lazy(() => import("../pages/profil/aday/page"));
const EmployerProfile = lazy(() => import("../pages/profil/isveren/page"));
const Favorites = lazy(() => import("../pages/favorilerim/page"));
const Admin = lazy(() => import("../pages/admin/page"));
const Packages = lazy(() => import("../pages/paketler/page"));
const Checkout = lazy(() => import("../pages/odeme/page"));
const PaymentSuccess = lazy(() => import("../pages/odeme/basarili/page"));
const PaymentCancel = lazy(() => import("../pages/odeme/iptal/page"));
const ForgotPassword = lazy(() => import("../pages/sifremi-unuttum/page"));
const ResetPassword = lazy(() => import("../pages/sifre-sifirla/page"));
const ProfileRedirect = lazy(() => import("../pages/profil/redirect"));
const KvkkPage = lazy(() =>
  import("../pages/yasal/pages").then((m) => ({ default: m.KvkkPage })),
);
const PrivacyPage = lazy(() =>
  import("../pages/yasal/pages").then((m) => ({ default: m.PrivacyPage })),
);
const DistanceSalesPage = lazy(() =>
  import("../pages/yasal/pages").then((m) => ({ default: m.DistanceSalesPage })),
);

const routes: RouteObject[] = [
  { path: "/", element: <Home /> },
  { path: "/ilanlar", element: <JobListings /> },
  { path: "/ilan/:id", element: <JobDetail /> },
  {
    path: "/ilan/:id/duzenle",
    element: (
      <RequireAuth roles={["employer", "admin"]}>
        <EditJob />
      </RequireAuth>
    ),
  },
  {
    path: "/ilan-ekle",
    element: (
      <RequireAuth roles={["employer", "admin"]}>
        <PostJob />
      </RequireAuth>
    ),
  },
  { path: "/paketler", element: <Packages /> },
  { path: "/odeme", element: <Checkout /> },
  { path: "/odeme/basarili", element: <PaymentSuccess /> },
  { path: "/odeme/iptal", element: <PaymentCancel /> },
  { path: "/giris", element: <Login /> },
  { path: "/kayit", element: <Register /> },
  { path: "/sifremi-unuttum", element: <ForgotPassword /> },
  { path: "/sifre-sifirla", element: <ResetPassword /> },
  { path: "/hakkimizda", element: <About /> },
  { path: "/iletisim", element: <Contact /> },
  { path: "/kvkk", element: <KvkkPage /> },
  { path: "/gizlilik", element: <PrivacyPage /> },
  { path: "/mesafeli-satis", element: <DistanceSalesPage /> },
  { path: "/profil", element: <ProfileRedirect /> },
  {
    path: "/profil/aday",
    element: (
      <RequireAuth roles={["candidate", "admin"]}>
        <CandidateProfile />
      </RequireAuth>
    ),
  },
  {
    path: "/profil/isveren",
    element: (
      <RequireAuth roles={["employer", "admin"]}>
        <EmployerProfile />
      </RequireAuth>
    ),
  },
  {
    path: "/basvurularim",
    element: (
      <RequireAuth roles={["candidate", "admin"]}>
        <CandidateProfile />
      </RequireAuth>
    ),
  },
  {
    path: "/ilanlarim",
    element: (
      <RequireAuth roles={["employer", "admin"]}>
        <EmployerProfile />
      </RequireAuth>
    ),
  },
  {
    path: "/favorilerim",
    element: (
      <RequireAuth>
        <Favorites />
      </RequireAuth>
    ),
  },
  {
    path: "/favoriler",
    element: (
      <RequireAuth>
        <Favorites />
      </RequireAuth>
    ),
  },
  {
    path: "/admin",
    element: (
      <RequireAuth roles={["admin"]}>
        <Admin />
      </RequireAuth>
    ),
  },
  { path: "*", element: <NotFound /> },
];

export default routes;
