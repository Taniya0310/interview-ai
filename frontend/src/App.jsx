import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
  useLocation
} from "react-router-dom";
import TrainingSetupPage
  from "./pages/TrainingSetupPage";
import { useEffect, useState } from "react";
import "./styles/auth.css";
import TrainingPage
  from "./pages/TrainingPage";
import {
  AuthProvider,
  useAuth
} from "./context/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";
import GifSplashScreen from "./components/GifSplashScreen";
import BottomNav from "./components/BottomNav";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import DeviceCheckPage from "./pages/DeviceCheckPage";
import InterviewSetupPage from "./pages/InterviewSetupPage";
import LiveInterviewPage from "./pages/LiveInterviewPage";
import ProcessingPage from "./pages/ProcessingPage";
import ResultsPage from "./pages/ResultsPage";
import AnswerDetailPage from "./pages/AnswerDetailPage";
import InterviewHistoryPage from "./pages/InterviewHistoryPage";
import SettingsPage from "./pages/SettingsPage";
import TrainingDeviceCheckPage
  from "./pages/TrainingDeviceCheckPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import QuestionsPage from "./pages/admin/QuestionsPage";
import CreateQuestionPage from "./pages/admin/CreateQuestionPage";
import EditQuestionPage from "./pages/admin/EditQuestionPage";
import GoogleCallbackPage
  from "./pages/GoogleCallbackPage";
function AdminDashboardRoute() {
  const navigate = useNavigate();

  return (
    <AdminDashboardPage
      onHome={() => navigate("/")}
      onQuestions={() => navigate("/admin/questions")}
      onCreateQuestion={() =>
        navigate("/admin/questions/create")
      }
    />
  );
}

function AdminQuestionsRoute() {
  const navigate = useNavigate();

  return (
    <QuestionsPage
      onBack={() => navigate("/admin")}
      onCreate={() =>
        navigate("/admin/questions/create")
      }
      onEdit={(id) =>
        navigate(`/admin/questions/edit/${id}`)
      }
    />
  );
}

function AdminCreateRoute() {
  const navigate = useNavigate();

  return (
    <CreateQuestionPage
      onBack={() =>
        navigate("/admin/questions")
      }
      onCreated={() =>
        navigate("/admin/questions")
      }
    />
  );
}

function AdminEditRoute() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <EditQuestionPage
      questionId={id}
      onBack={() =>
        navigate("/admin/questions")
      }
      onUpdated={() =>
        navigate("/admin/questions")
      }
    />
  );
}

function GlobalBottomNav() {
  const location = useLocation();

  const hidden =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/verify-otp" ||
    location.pathname.startsWith("/admin") ||
    location.pathname === "/interview/live";

  return hidden ? null : <BottomNav />;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant"
    });
  }, [pathname]);

  return null;
}

function App() {
  const { user } = useAuth();

  const [showSplash, setShowSplash] =
    useState(true);

  useEffect(() => {
  if (!user || showSplash) {
    return;
  }

  window.AndroidTTS?.startModelCheck?.();
}, [user, showSplash]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <GifSplashScreen />;
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <GlobalBottomNav />

      <Routes>
        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/signup"
          element={<SignupPage />}
        />

        <Route
          path="/verify-otp"
          element={<VerifyOtpPage />}
        />
<Route
  path="/google-callback"
  element={<GoogleCallbackPage />}
/>
        <Route
          path="/"
          element={
            localStorage.getItem(
              "hasSeenLanding"
            ) === "true" ? (
              <Navigate
                to="/dashboard"
                replace
              />
            ) : (
              <LandingPage />
            )
          }
        />

        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          <Route
            path="/profile"
            element={<ProfilePage />}
          />
<Route
  path="/training/setup"
  element={<TrainingSetupPage />}
/>
<Route
  path="/training"
  element={<TrainingPage />}
/>
<Route
  path="/training/device-check"
  element={<TrainingDeviceCheckPage />}
/>
          <Route
            path="/interview/setup"
            element={<InterviewSetupPage />}
          />

          <Route
            path="/interview/device-check"
            element={<DeviceCheckPage />}
          />

          <Route
            path="/interview/live"
            element={<LiveInterviewPage />}
          />

          <Route
            path="/interview/processing"
            element={<ProcessingPage />}
          />

          <Route
            path="/interview/results"
            element={<ResultsPage />}
          />

          <Route
            path="/interview/answer/:id"
            element={<AnswerDetailPage />}
          />

          <Route
            path="/interview/history"
            element={<InterviewHistoryPage />}
          />

          <Route
            path="/settings"
            element={<SettingsPage />}
          />
        </Route>

        <Route
          path="/admin"
          element={<AdminDashboardRoute />}
        />

        <Route
          path="/admin/questions"
          element={<AdminQuestionsRoute />}
        />

        <Route
          path="/admin/questions/create"
          element={<AdminCreateRoute />}
        />

        <Route
          path="/admin/questions/edit/:id"
          element={<AdminEditRoute />}
        />

        <Route
          path="*"
          element={
            <Navigate to="/" replace />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default function AppWithAuth() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}