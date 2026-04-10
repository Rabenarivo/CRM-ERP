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
    <div className="page-card">
      <div className="page-card__header">
        <div>
          <p className="page-eyebrow">Accueil</p>
          <h2>Dashboard</h2>
        </div>
        <p className="page-muted">Vue d'ensemble de votre acces metier.</p>
      </div>

      <div className="row">
        <div className="col-sm-4">
          <div className="panel panel-default">
            <div className="panel-heading">Utilisateur</div>
            <div className="panel-body">
              <strong>{user?.nom || "Unknown"}</strong>
            </div>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="panel panel-default">
            <div className="panel-heading">Departement</div>
            <div className="panel-body">
              <strong>{user?.department?.nom || "Unknown"}</strong>
            </div>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="panel panel-default">
            <div className="panel-heading">Score</div>
            <div className="panel-body">
              <strong>{userScore}</strong>
            </div>
          </div>
        </div>
      </div>

      <h3>Types de pages disponibles</h3>
      <ul className="list-group">
        {PAGE_TYPES.map((page) => (
          <li key={page.score} className="list-group-item">
            {userScore >= page.score ? (
              <Link to={page.path}>Type {page.score}</Link>
            ) : (
              <span className="text-muted">Type {page.score} (locked)</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
