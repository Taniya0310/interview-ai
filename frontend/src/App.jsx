import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useEffect, useState } from "react";

import GifSplashScreen from "./components/GifSplashScreen";

import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import DeviceCheckPage from "./pages/DeviceCheckPage";
import InterviewSetupPage from "./pages/InterviewSetupPage";
import LiveInterviewPage from "./pages/LiveInterviewPage";
import ProcessingPage from "./pages/ProcessingPage";
import ResultsPage from "./pages/ResultsPage";
import AnswerDetailPage from "./pages/AnswerDetailPage";
import InterviewHistoryPage from "./pages/InterviewHistoryPage";
import SettingsPage from "./pages/SettingsPage";

import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import QuestionsPage from "./pages/admin/QuestionsPage";
import CreateQuestionPage from "./pages/admin/CreateQuestionPage";
import EditQuestionPage from "./pages/admin/EditQuestionPage";

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
      onBack={() => navigate("/admin/questions")}
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
      onBack={() => navigate("/admin/questions")}
      onUpdated={() =>
        navigate("/admin/questions")
      }
    />
  );
}

function App() {
  const [showSplash, setShowSplash] =
    useState(true);

  useEffect(() => {
    const splashDuration = 3000;

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, splashDuration);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <GifSplashScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
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

        <Route
          path="/dashboard"
          element={<DashboardPage />}
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

export default App;