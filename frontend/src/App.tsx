import HomePage from "./components/pages/HomePage";
import FavoritesPage from "./components/pages/FavoritesPage";
import { Route, Routes } from "react-router-dom";
import ArchivePage from "./components/pages/ArchivePage";
import DefaultLayout from "./components/templates/DefaulLayout";
import ErrorPage from "./components/pages/ErrorPage";
import ReactErrorBoundary from "./components/error/ReactErrorBoundary";
import { useNavigate } from "react-router-dom";
import LoginPage from "./components/pages/LoginPage";
import OAuthCallbackPage from "./components/pages/OAuthCallbackPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { useSearchParams } from "react-router-dom";
import SignupPage from "./components/pages/SignupPage";
import AccountPage from "./components/pages/AccountPage";
import CalendarGrid from "./components/pages/CalendarPage";
import GroupsPage from "./components/pages/GroupsPage";
import GroupDetailPage from "./components/pages/GroupDetailPage";
import JoinGroupPage from "./components/pages/JoinGroupPage";

function OAuthErrorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  return (
    <ErrorPage
      errorCode={401}
      errorMessage={
        searchParams.get("message") ?? "Google-Login fehlgeschlagen."
      }
      buttonText="Zurück zum Login"
      resetErrorBoundary={() => navigate("/login")}
    />
  );
}

function App() {
  const navigate = useNavigate();
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<SignupPage />} />
      <Route path="/oauth/success" element={<OAuthCallbackPage />} />
      <Route path="/auth/error" element={<OAuthErrorPage />} />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <DefaultLayout pageTitle="Dein Kalender">
              <ReactErrorBoundary
                errorMessage="Dein Kalender konnte nicht angezeigt werden."
                fullScreen={false}
              >
                <CalendarGrid />
              </ReactErrorBoundary>
            </DefaultLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/setting/account"
        element={
          <ProtectedRoute>
            <DefaultLayout pageTitle="Account">
              <ReactErrorBoundary
                errorMessage="Dein Account konnte nicht angezeigt werden."
                fullScreen={false}
              >
                <AccountPage />
              </ReactErrorBoundary>
            </DefaultLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DefaultLayout pageTitle="Deine Aufgaben">
              <ReactErrorBoundary
                errorMessage="Deine Aufgaben konnten nicht angezeigt werden."
                fullScreen={false}
              >
                <HomePage />
              </ReactErrorBoundary>
            </DefaultLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/favorites"
        element={
          <ProtectedRoute>
            <DefaultLayout pageTitle="Deine Favoriten">
              <ReactErrorBoundary
                errorMessage="Deine Favoriten konnten nicht angezeigt werden."
                fullScreen={false}
              >
                <FavoritesPage />
              </ReactErrorBoundary>
            </DefaultLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/archive"
        element={
          <ProtectedRoute>
            <DefaultLayout pageTitle="Dein Archiv">
              <ReactErrorBoundary
                errorMessage="Dein Archiv konnte nicht angezeigt werden."
                fullScreen={false}
              >
                <ArchivePage />
              </ReactErrorBoundary>
            </DefaultLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/groups"
        element={
          <ProtectedRoute>
            <DefaultLayout pageTitle="Deine Gruppen">
              <ReactErrorBoundary
                errorMessage="Deine Gruppen konnten nicht angezeigt werden."
                fullScreen={false}
              >
                <GroupsPage />
              </ReactErrorBoundary>
            </DefaultLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/groups/:id"
        element={
          <ProtectedRoute>
            <DefaultLayout pageTitle="Gruppendetails">
              <ReactErrorBoundary
                errorMessage="Die Gruppe konnte nicht angezeigt werden."
                fullScreen={false}
              >
                <GroupDetailPage />
              </ReactErrorBoundary>
            </DefaultLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/groups/join/:code"
        element={
          <ProtectedRoute>
            <DefaultLayout pageTitle="Gruppe beitreten">
              <ReactErrorBoundary
                errorMessage="Der Einladungslink konnte nicht verarbeitet werden."
                fullScreen={false}
              >
                <JoinGroupPage />
              </ReactErrorBoundary>
            </DefaultLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/*"
        element={
          <ErrorPage
            errorCode={404}
            errorMessage="Seite nicht gefunden"
            buttonText="Zurück zur Startseite"
            resetErrorBoundary={() => navigate("/")}
          />
        }
      />
    </Routes>
  );
}

export default App;
