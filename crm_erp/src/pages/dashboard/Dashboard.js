import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { getUserDepartmentScore } from "../../config/departmentScores";

const PAGE_TYPES = [
  { score: 50, path: "/pages/type-50" },
  { score: 70, path: "/pages/type-70" },
  { score: 80, path: "/pages/type-80" },
  { score: 100, path: "/pages/type-100" },
];

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const userScore = getUserDepartmentScore(user);

  return (
    <div style={{ padding: "24px" }}>
      <h1>Dashboard</h1>
      <p>
        User: <strong>{user?.nom || "Unknown"}</strong>
      </p>
      <p>
        Department: <strong>{user?.department?.nom || "Unknown"}</strong>
      </p>
      <p>
        Score: <strong>{userScore}</strong>
      </p>

      <h2>Available page types</h2>
      <ul>
        {PAGE_TYPES.map((page) => (
          <li key={page.score}>
            {userScore >= page.score ? (
              <Link to={page.path}>Type {page.score}</Link>
            ) : (
              <span>Type {page.score} (locked)</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
