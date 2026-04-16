import { NavLink, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getUserDepartmentScore } from "../config/departmentScores";
import { logout } from "../services/authService";

const NAV_ITEMS = [
  { label: "Accueil", path: "/dashboard", minScore: 0 },
  { label: "Workflow Demande d'achat", path: "/pages/type-10", requiredScore: 10 },
  { label: "Demande d'achat", path: "/pages/type-50", requiredScore: 50 },
  { label: "Validation Offres", path: "/pages/type-70", requiredScore: 70 },
  { label: "Validation Proforma et Envoi BC", path: "/pages/type-80", requiredScore: 80 },
  { label: "Proformas Acceptees", path: "/pages/type-80-acceptee", requiredScore: 80 },
  { label: "Creation Proformat (Admin)", path: "/pages/type-100", requiredScore: 100 },
];

export default function AppNavbar() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const userScore = getUserDepartmentScore(user);
  const isAuthenticated = Boolean(user);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-default app-navbar" role="navigation">
      <div className="container">
        <div className="navbar-header app-navbar__brand">
          <span className="navbar-brand app-navbar__brand-label">CRM ERP</span>
          <p className="navbar-text app-navbar__meta">
            {user ? `${user.nom} - Score ${userScore}` : "Connectez-vous pour acceder aux pages"}
          </p>
        </div>

        <ul className="nav navbar-nav navbar-right app-navbar__nav" aria-label="Navigation principale">
          {!isAuthenticated ? (
            <li>
              <NavLink to="/login" className="app-navbar__link">
                Connexion
              </NavLink>
            </li>
          ) : (
            NAV_ITEMS.filter((item) => {
              return Number.isFinite(item.requiredScore)
                ? userScore === item.requiredScore
                : userScore >= item.minScore;
            }).map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `app-navbar__link${isActive ? " app-navbar__link--active" : ""}`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))
          )}

          {isAuthenticated ? (
            <li className="app-navbar__logout-item">
              <button type="button" className="btn btn-theme navbar-btn" onClick={handleLogout}>
                Deconnexion
              </button>
            </li>
          ) : null}
        </ul>
      </div>
    </nav>
  );
}