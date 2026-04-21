import { Link } from "react-router-dom";
import Type120AdminNav from "../../components/Type120AdminNav";

const ADMIN_CARDS = [
  {
    title: "Workflow logs",
    description: "Consulter tous les logs avec filtres avances.",
    path: "/pages/type-120/workflow",
  },
  {
    title: "Utilisateurs",
    description: "Creer, modifier et supprimer les comptes utilisateurs.",
    path: "/pages/type-120/users",
  },
  {
    title: "Departements",
    description: "Gerer les departements et leurs scores.",
    path: "/pages/type-120/departements",
  },
  {
    title: "Produits",
    description: "Lister les produits et les assigner a un departement.",
    path: "/pages/type-120/produits",
  },
  {
    title: "Factures",
    description: "Analyser toutes les factures et leurs statuts.",
    path: "/pages/type-120/factures",
  },
];

export default function Type120Page() {
  return (
    <div className="page-card">
      <Type120AdminNav />

      <section className="workflow-card">
        <div className="request-list__header">
          <div>
            <p className="page-eyebrow">Score 120</p>
            <h3>Administration complete</h3>
            <p className="page-muted">Chaque fonctionnalite est maintenant separee page par page.</p>
          </div>
        </div>

        <div className="row" style={{ marginTop: 8 }}>
          {ADMIN_CARDS.map((card) => (
            <div className="col-md-6" key={card.path} style={{ marginBottom: 12 }}>
              <div className="request-item" style={{ padding: 14 }}>
                <h4 style={{ marginTop: 0 }}>{card.title}</h4>
                <p className="page-muted" style={{ marginBottom: 10 }}>
                  {card.description}
                </p>
                <Link to={card.path} className="btn btn-primary btn-sm">
                  Ouvrir la page
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
