import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/auth/login";
import Dashboard from "./pages/dashboard/Dashboard";
import { AuthProvider } from "./context/AuthContext";
import ScoreProtectedRoute from "./components/ScoreProtectedRoute";
import Unauthorized from "./pages/common/Unauthorized";
import Type50Page from "./pages/types/Type50Page";
import Type10Page from "./pages/types/type10Pages";
import Type70Page from "./pages/types/Type70Page";
import Type80Page from "./pages/types/Type80Page";
import Type100Page from "./pages/types/Type100Page";
import DemandeAchatPage from "./pages/demandes-achat/DemandeAchatPage";
import PageLayout from "./components/PageLayout";

function ProtectedPage({ minScore, children }) {
  return (
    <ScoreProtectedRoute minScore={minScore}>
      <PageLayout>{children}</PageLayout>
    </ScoreProtectedRoute>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <PageLayout>
                <Dashboard />
              </PageLayout>
            }
          />
          <Route path="/unauthorized" element={<Unauthorized />} />


          <Route
            path="/pages/type-10"
            element={
              <ProtectedPage minScore={10}>
                <Type10Page />
              </ProtectedPage>
            }
          />
          <Route
            path="/pages/type-50"
            element={
              <ProtectedPage minScore={50}>
                <Type50Page />
              </ProtectedPage>
            }
          />
          <Route
            path="/pages/demandes-achat"
            element={
              <ProtectedPage minScore={10}>
                <DemandeAchatPage />
              </ProtectedPage>
            }
          />

          <Route
            path="/pages/type-70"
            element={
              <ProtectedPage minScore={70}>
                <Type70Page />
              </ProtectedPage>
            }
          />

          <Route
            path="/pages/type-80"
            element={
              <ProtectedPage minScore={80}>
                <Type80Page />
              </ProtectedPage>
            }
          />

          <Route
            path="/pages/type-100"
            element={
              <ProtectedPage minScore={100}>
                <Type100Page />
              </ProtectedPage>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;