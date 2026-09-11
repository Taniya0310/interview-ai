import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
} from "react-router-dom";

import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./components/AdminLayout";

import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import UsersPage from "./pages/UsersPage";
import InterviewsPage from "./pages/InterviewsPage";
import SettingsPage from "./pages/SettingsPage";
import QuestionsPage from "./pages/QuestionsPage";
import CreateQuestionPage from "./pages/CreateQuestionPage";
import EditQuestionPage from "./pages/EditQuestionPage";
import TokenManagementPage from "./pages/TokenManagementPage";
function QuestionsRoute() {
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

function CreateQuestionRoute() {
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

function EditQuestionRoute() {
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/admin/login"
          element={<AdminLoginPage />}
        />

        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route
              path="/admin"
              element={<AdminDashboardPage />}
            />

            <Route
              path="/admin/users"
              element={<UsersPage />}
            />

            <Route
              path="/admin/interviews"
              element={<InterviewsPage />}
            />

            <Route
              path="/admin/questions"
              element={<QuestionsRoute />}
            />

            <Route
              path="/admin/questions/create"
              element={<CreateQuestionRoute />}
            />

            <Route
              path="/admin/questions/edit/:id"
              element={<EditQuestionRoute />}
            />
<Route
  path="/admin/token-management"
  element={<TokenManagementPage />}
/>
            <Route
              path="/admin/settings"
              element={<SettingsPage />}
            />
          </Route>
        </Route>

        <Route
          path="*"
          element={
            <Navigate
              to="/admin/login"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

