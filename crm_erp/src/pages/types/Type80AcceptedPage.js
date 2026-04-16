import { useEffect, useMemo, useState } from "react";
import { getAcceptedProformas } from "../../api/proformaApi";
import { MiniBarChart, StatGrid, formatMga } from "../../components/StatsWidgets";

export default function Type80AcceptedPage() {
  const [proformas, setProformas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAccepted = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getAcceptedProformas();
        setProformas(Array.isArray(response.data) ? response.data : []);
      } catch (loadError) {
        setError("Impossible de charger les proformas acceptees.");
      } finally {
        setLoading(false);
      }
    };

    loadAccepted();
  }, []);

  const totalBudget = useMemo(
    () => proformas.reduce((sum, proforma) => sum + Number(proforma?.prix || 0), 0),
    [proformas]
  );

  const proformasByFournisseur = useMemo(() => {
    const counter = new Map();
    proformas.forEach((proforma) => {
      const fournisseur =
        proforma?.fournisseur?.nom || `Fournisseur ${proforma?.fournisseur?.id || "N/A"}`;
      counter.set(fournisseur, (counter.get(fournisseur) || 0) + 1);
    });

    return Array.from(counter.entries()).map(([label, value]) => ({ label, value }));
  }, [proformas]);

  const stats = [
    { label: "Proformas acceptees", value: proformas.length },
    { label: "Budget accepte", value: formatMga(totalBudget) },
    { label: "Fournisseurs", value: proformasByFournisseur.length },
  ];

  return (
    <div className="page-card">
      <div className="page-card__header">
        <div>
          <p className="page-eyebrow">Score 80</p>
          <h2>Liste des Proformas Acceptees</h2>
        </div>
        <p className="page-muted">API: /api/proforma/accepte</p>
      </div>

      {error ? <div className="alert alert-warning page-alert">{error}</div> : null}

      <StatGrid items={stats} />

      <MiniBarChart
        title="Proformas acceptees par fournisseur"
        data={proformasByFournisseur}
        emptyLabel="Aucune proforma acceptee pour le moment."
      />

      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead>
            <tr>
              <th>ID</th>
              <th>Demande</th>
              <th>Fournisseur</th>
              <th>Prix</th>
              <th>Delai</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center">Chargement...</td>
              </tr>
            ) : proformas.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">Aucune proforma acceptee.</td>
              </tr>
            ) : (
              proformas.map((proforma) => (
                <tr key={proforma.id}>
                  <td>{proforma.id}</td>
                  <td>{proforma.demande?.id || "-"}</td>
                  <td>{proforma.fournisseur?.nom || `ID ${proforma.fournisseur?.id || "-"}`}</td>
                  <td>{proforma.prix ?? "-"}</td>
                  <td>{proforma.delai ?? "-"}</td>
                  <td>{proforma.statut || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
