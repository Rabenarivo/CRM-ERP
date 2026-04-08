import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/auth/login";
import Dashboard from "./pages/dashboard/Dashboard";
import { AuthProvider } from "./context/AuthContext";
import ScoreProtectedRoute from "./components/ScoreProtectedRoute";
import Unauthorized from "./pages/common/Unauthorized";
import Type50Page from "./pages/types/Type50Page";
import Type70Page from "./pages/types/Type70Page";
import Type80Page from "./pages/types/Type80Page";
import Type100Page from "./pages/types/Type100Page";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route
            path="/pages/type-50"
            element={
              <ScoreProtectedRoute minScore={50}>
                <Type50Page />
              </ScoreProtectedRoute>
            }
          />

          <Route
            path="/pages/type-70"
            element={
              <ScoreProtectedRoute minScore={70}>
                <Type70Page />
              </ScoreProtectedRoute>
            }
          />

          <Route
            path="/pages/type-80"
            element={
              <ScoreProtectedRoute minScore={80}>
                <Type80Page />
              </ScoreProtectedRoute>
            }
          />

          <Route
            path="/pages/type-100"
            element={
              <ScoreProtectedRoute minScore={100}>
                <Type100Page />
              </ScoreProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;