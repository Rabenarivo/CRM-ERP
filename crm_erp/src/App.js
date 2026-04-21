import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/auth/login";
import Dashboard from "./pages/dashboard/Dashboard";
import { AuthProvider } from "./context/AuthContext";
import ScoreProtectedRoute from "./components/ScoreProtectedRoute";
import Unauthorized from "./pages/common/Unauthorized";
import Type10Page from "./pages/types/type10Pages";
import Type70Page from "./pages/types/Type70Page";
import Type80Page from "./pages/types/Type80Page";
import Type80AcceptedPage from "./pages/types/Type80AcceptedPage";
import Type100Page from "./pages/types/Type100Page";
import Type120Page from "./pages/types/Type120Page";
import Type120WorkflowPage from "./pages/types/Type120WorkflowPage";
import Type120UsersPage from "./pages/types/Type120UsersPage";
import Type120DepartmentsPage from "./pages/types/Type120DepartmentsPage";
import Type120ProduitsPage from "./pages/types/Type120ProduitsPage";
import Type120FacturesPage from "./pages/types/Type120FacturesPage";
import Type60Page from "./pages/types/Type60Page";
import DemandeAchatPage from "./pages/demandes-achat/DemandeAchatPage";
import PageLayout from "./components/PageLayout";

function ProtectedPage({ minScore, requiredScore, children }) {
  return (
    <ScoreProtectedRoute minScore={minScore} requiredScore={requiredScore}>
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
              <ProtectedPage requiredScore={10}>
                <Type10Page />
              </ProtectedPage>
            }
          />
          <Route
            path="/pages/type-50"
            element={
              <ProtectedPage requiredScore={50}>
                <DemandeAchatPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/pages/type-60"
            element={
              <ProtectedPage requiredScore={60}>
                <Type60Page />
              </ProtectedPage>
            }
          />

          <Route
            path="/pages/demandes-achat"
            element={
              <ProtectedPage requiredScore={50}>
                <DemandeAchatPage />
              </ProtectedPage>
            }
          />

          <Route
            path="/pages/type-70"
            element={
              <ProtectedPage requiredScore={70}>
                <Type70Page />
              </ProtectedPage>
            }
          />

          <Route
            path="/pages/type-80"
            element={
              <ProtectedPage requiredScore={80}>
                <Type80Page />
              </ProtectedPage>
            }
          />

          <Route
            path="/pages/type-80-acceptee"
            element={
              <ProtectedPage requiredScore={80}>
                <Type80AcceptedPage />
              </ProtectedPage>
            }
          />

          <Route
            path="/pages/type-100"
            element={
              <ProtectedPage requiredScore={100}>
                <Type100Page />
              </ProtectedPage>
            }
          />
          <Route
            path="/pages/type-120"
            element={
              <ProtectedPage requiredScore={120}>
                <Type120Page />
              </ProtectedPage>
            }
          />
          <Route
            path="/pages/type-120/workflow"
            element={
              <ProtectedPage requiredScore={120}>
                <Type120WorkflowPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/pages/type-120/users"
            element={
              <ProtectedPage requiredScore={120}>
                <Type120UsersPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/pages/type-120/departements"
            element={
              <ProtectedPage requiredScore={120}>
                <Type120DepartmentsPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/pages/type-120/produits"
            element={
              <ProtectedPage requiredScore={120}>
                <Type120ProduitsPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/pages/type-120/factures"
            element={
              <ProtectedPage requiredScore={120}>
                <Type120FacturesPage />
              </ProtectedPage>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;