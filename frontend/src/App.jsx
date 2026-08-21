import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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

// Admin pages
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import QuestionsPage from "./pages/admin/QuestionsPage";
import CreateQuestionPage from "./pages/admin/CreateQuestionPage";
import EditQuestionPage from "./pages/admin/EditQuestionPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================= USER ================= */}

        <Route
          path="/"
          element={<LandingPage />}
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

        {/* ================= ADMIN ================= */}

        <Route
          path="/admin"
          element={<AdminDashboardPage />}
        />

        <Route
          path="/admin/questions"
          element={<QuestionsPage />}
        />

        <Route
          path="/admin/questions/create"
          element={<CreateQuestionPage />}
        />

        <Route
          path="/admin/questions/edit/:id"
          element={<EditQuestionPage />}
        />

        {/* ================= FALLBACK ================= */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;