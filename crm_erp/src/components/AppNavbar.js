import { NavLink, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getUserDepartmentScore } from "../config/departmentScores";
import { logout } from "../services/authService";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/dashboard", minScore: 0 },
  { label: "Type 10", path: "/pages/type-10", minScore: 10 },
  { label: "Type 50", path: "/pages/type-50", minScore: 50 },
  { label: "Demandes d'achat", path: "/pages/demandes-achat", minScore: 50 },
  { label: "Type 70", path: "/pages/type-70", minScore: 70 },
  { label: "Type 80", path: "/pages/type-80", minScore: 80 },
  { label: "Type 100", path: "/pages/type-100", minScore: 100 },
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
            NAV_ITEMS.map((item) => {
              const allowed = userScore >= item.minScore;

              if (!allowed) {
                return (
                  <li key={item.path} className="disabled app-navbar__link--locked-item">
                    <span className="app-navbar__link app-navbar__link--locked">{item.label}</span>
                  </li>
                );
              }

              return (
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
              );
            })
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