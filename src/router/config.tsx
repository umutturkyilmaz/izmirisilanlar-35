import type { RouteObject } from "react-router-dom";
import Home from "../pages/home/page";
import { RequireAuth } from "../components/feature/RequireAuth";
import { lazyRetry } from "@/lib/lazyRetry";

const NotFound = lazyRetry(() => import("../pages/NotFound"));
const JobListings = lazyRetry(() => import("../pages/ilanlar/page"));
const JobDetail = lazyRetry(() => import("../pages/ilanlar/detail/page"));
const EditJob = lazyRetry(() => import("../pages/ilanlar/edit/page"));
const Login = lazyRetry(() => import("../pages/giris/page"));
const Register = lazyRetry(() => import("../pages/kayit/page"));
const About = lazyRetry(() => import("../pages/hakkimizda/page"));
const Contact = lazyRetry(() => import("../pages/iletisim/page"));
const PostJob = lazyRetry(() => import("../pages/ilan-ekle/page"));
const CandidateProfile = lazyRetry(() => import("../pages/profil/aday/page"));
const EmployerProfile = lazyRetry(() => import("../pages/profil/isveren/page"));
const Favorites = lazyRetry(() => import("../pages/favorilerim/page"));
const Admin = lazyRetry(() => import("../pages/admin/page"));
const Packages = lazyRetry(() => import("../pages/paketler/page"));
const Checkout = lazyRetry(() => import("../pages/odeme/page"));
const PaymentSuccess = lazyRetry(() => import("../pages/odeme/basarili/page"));
const PaymentCancel = lazyRetry(() => import("../pages/odeme/iptal/page"));
const ForgotPassword = lazyRetry(() => import("../pages/sifremi-unuttum/page"));
const ResetPassword = lazyRetry(() => import("../pages/sifre-sifirla/page"));
const EmailVerify = lazyRetry(() => import("../pages/email-dogrula/page"));
const ProfileRedirect = lazyRetry(() => import("../pages/profil/redirect"));
const KvkkPage = lazyRetry(() =>
  import("../pages/yasal/pages").then((m) => ({ default: m.KvkkPage })),
);
const PrivacyPage = lazyRetry(() =>
  import("../pages/yasal/pages").then((m) => ({ default: m.PrivacyPage })),
);
const DistanceSalesPage = lazyRetry(() =>
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
  {
    path: "/odeme",
    element: (
      <RequireAuth roles={["employer", "admin"]}>
        <Checkout />
      </RequireAuth>
    ),
  },
  { path: "/odeme/basarili", element: <PaymentSuccess /> },
  { path: "/odeme/iptal", element: <PaymentCancel /> },
  { path: "/giris", element: <Login /> },
  { path: "/kayit", element: <Register /> },
  { path: "/sifremi-unuttum", element: <ForgotPassword /> },
  { path: "/sifre-sifirla", element: <ResetPassword /> },
  { path: "/email-dogrula", element: <EmailVerify /> },
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
