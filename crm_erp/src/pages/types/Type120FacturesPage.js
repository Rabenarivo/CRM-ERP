import { useEffect, useMemo, useState } from "react";
import { getAllFactures } from "../../api/factureApi";
import Type120AdminNav from "../../components/Type120AdminNav";

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

export default function Type120FacturesPage() {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    statut: "",
  });

  useEffect(() => {
    const loadFactures = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getAllFactures();
        setFactures(Array.isArray(response.data) ? response.data : []);
      } catch (loadError) {
        setFactures([]);
        setError("Impossible de charger les factures.");
      } finally {
        setLoading(false);
      }
    };

    loadFactures();
  }, []);

  const facturesByStatut = useMemo(() => {
    const counter = new Map();
    factures.forEach((facture) => {
      const label = String(facture?.statut || "SANS_STATUT");
      counter.set(label, (counter.get(label) || 0) + 1);
    });
    return Array.from(counter.entries()).map(([label]) => label);
  }, [factures]);

  const filteredFactures = useMemo(() => {
    const search = normalize(filters.search);
    const statut = normalize(filters.statut);

    return factures.filter((facture) => {
      const matchesSearch =
        !search ||
        [facture?.reference, facture?.client?.nom, facture?.livraison?.reference, facture?.statut]
          .filter(Boolean)
          .some((value) => normalize(value).includes(search));
      const matchesStatut = !statut || normalize(facture?.statut) === statut;
      return matchesSearch && matchesStatut;
    });
  }, [factures, filters]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  return (
    <div className="page-card">
      <Type120AdminNav />

      {error ? <div className="alert alert-warning page-alert">{error}</div> : null}

      <section className="workflow-card">
        <div className="request-list__header">
          <div>
            <h3>Liste factures</h3>
            <p className="page-muted">Consultation globale des factures avec filtre rapide.</p>
          </div>
        </div>

        <div className="row" style={{ marginBottom: 12 }}>
          <div className="col-md-8">
            <label className="form-label">Recherche</label>
            <input className="form-control" name="search" value={filters.search} onChange={handleFilterChange} placeholder="Reference, client, livraison..." />
          </div>
          <div className="col-md-4">
            <label className="form-label">Statut</label>
            <select className="form-control" name="statut" value={filters.statut} onChange={handleFilterChange}>
              <option value="">Tous</option>
              {facturesByStatut.map((statut) => (
                <option key={statut} value={statut}>{statut}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-striped table-bordered">
            <thead>
              <tr>
                <th>ID</th>
                <th>Reference</th>
                <th>Client</th>
                <th>Livraison</th>
                <th>Montant HT</th>
                <th>TVA</th>
                <th>TTC</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" className="text-center">Chargement...</td></tr>
              ) : filteredFactures.length === 0 ? (
                <tr><td colSpan="9" className="text-center">Aucune facture.</td></tr>
              ) : (
                filteredFactures.map((facture) => (
                  <tr key={facture.id}>
                    <td>{facture.id}</td>
                    <td>{facture.reference || "-"}</td>
                    <td>{facture.client?.nom || "-"}</td>
                    <td>{facture.livraison?.reference || facture.livraison?.id || "-"}</td>
                    <td>{facture.montantHt ?? "-"}</td>
                    <td>{facture.tva ?? "-"}</td>
                    <td>{facture.montantTtc ?? "-"}</td>
                    <td>{facture.statut || "-"}</td>
                    <td>{formatDateTime(facture.dateFacture)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
