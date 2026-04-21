import { NavLink } from "react-router-dom";

const ADMIN_SECTIONS = [
  { label: "Accueil Admin", path: "/pages/type-120" },
  { label: "Workflow logs", path: "/pages/type-120/workflow" },
  { label: "Utilisateurs", path: "/pages/type-120/users" },
  { label: "Departements", path: "/pages/type-120/departements" },
  { label: "Produits", path: "/pages/type-120/produits" },
  { label: "Factures", path: "/pages/type-120/factures" },
];

export default function Type120AdminNav() {
  return (
    <div className="workflow-card" style={{ marginBottom: 16 }}>
      <div className="request-list__header">
        <div>
          <h3>Administration complete</h3>
          <p className="page-muted">Pages separees, une section par ecran.</p>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {ADMIN_SECTIONS.map((section) => (
          <NavLink
            key={section.path}
            to={section.path}
            className={({ isActive }) =>
              `btn btn-sm ${isActive ? "btn-primary" : "btn-default"}`
            }
          >
            {section.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
