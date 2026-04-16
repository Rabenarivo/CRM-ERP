import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getUserDepartmentScore } from "../config/departmentScores";

export default function ScoreProtectedRoute({ minScore, requiredScore, children }) {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userScore = getUserDepartmentScore(user);
  if (Number.isFinite(requiredScore) && userScore !== requiredScore) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (userScore < minScore) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
