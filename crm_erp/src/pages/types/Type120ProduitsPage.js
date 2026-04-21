import { useEffect, useMemo, useState } from "react";
import { getDepartments } from "../../api/departmentApi";
import { getProduits, transferProduitToDepartment } from "../../api/produitApi";
import Type120AdminNav from "../../components/Type120AdminNav";

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const formatPrice = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "-";
  return new Intl.NumberFormat("fr-FR").format(amount);
};

export default function Type120ProduitsPage() {
  const [produits, setProduits] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState({ search: "", departmentId: "" });
  const [assigningProduitId, setAssigningProduitId] = useState(null);
  const [assignmentByProduit, setAssignmentByProduit] = useState({});
  const [quantityByProduit, setQuantityByProduit] = useState({});

  const refreshData = async () => {
    setLoading(true);
    setError("");
    try {
      const [produitsRes, departmentsRes] = await Promise.allSettled([
        getProduits(),
        getDepartments(),
      ]);

      setProduits(
        produitsRes.status === "fulfilled" && Array.isArray(produitsRes.value.data)
          ? produitsRes.value.data
          : []
      );
      setDepartments(
        departmentsRes.status === "fulfilled" && Array.isArray(departmentsRes.value.data)
          ? departmentsRes.value.data
          : []
      );
    } catch (loadError) {
      setError("Impossible de charger les produits.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const filteredProduits = useMemo(() => {
    const search = normalize(filters.search);
    const departmentId = normalize(filters.departmentId);

    return produits
      .filter((produit) => {
        const matchesSearch =
          !search ||
          [produit?.nom, produit?.id, produit?.department?.nom]
            .filter(Boolean)
            .some((value) => normalize(value).includes(search));
        const matchesDepartment =
          !departmentId || String(produit?.department?.id || "") === departmentId;
        return matchesSearch && matchesDepartment;
      })
      .sort((a, b) => {
        const byName = String(a?.nom || "").localeCompare(String(b?.nom || ""), "fr", {
          sensitivity: "base",
        });
        if (byName !== 0) return byName;
        const byDepartment = Number(a?.department?.id || 0) - Number(b?.department?.id || 0);
        if (byDepartment !== 0) return byDepartment;
        return Number(a?.id || 0) - Number(b?.id || 0);
      });
  }, [filters, produits]);

  const centralProduits = useMemo(
    () => filteredProduits.filter((produit) => !produit?.department?.id),
    [filteredProduits]
  );

  const historiqueProduits = useMemo(
    () => filteredProduits.filter((produit) => Boolean(produit?.department?.id)),
    [filteredProduits]
  );

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleProduitDepartmentSelect = (produitId, departmentId) => {
    setAssignmentByProduit((current) => ({
      ...current,
      [produitId]: departmentId,
    }));
  };

  const handleProduitQuantityChange = (produitId, quantite) => {
    setQuantityByProduit((current) => ({
      ...current,
      [produitId]: quantite,
    }));
  };

  const handleAssignProduitDepartment = async (produit) => {
    const selectedDepartmentId = assignmentByProduit[produit.id];
    const currentDepartmentId = produit?.department?.id ? String(produit.department.id) : "";
    const rawQuantite = quantityByProduit[produit.id] || "1";
    const quantite = Number(rawQuantite);

    if (selectedDepartmentId === currentDepartmentId) {
      setMessage("Le produit est deja assigne a ce departement.");
      return;
    }

    if (!selectedDepartmentId) {
      setError("Veuillez selectionner un departement cible.");
      return;
    }

    if (!Number.isInteger(quantite) || quantite <= 0) {
      setError("La quantite doit etre un entier positif.");
      return;
    }

    setMessage("");
    setError("");
    setAssigningProduitId(produit.id);

    try {
      await transferProduitToDepartment(
        produit.id,
        selectedDepartmentId ? Number(selectedDepartmentId) : null,
        quantite
      );
      setMessage(`Transfert de ${quantite} unite(s) effectue.`);
      await refreshData();
    } catch (assignError) {
      setError(assignError?.response?.data?.message || "Impossible de transferer le produit.");
    } finally {
      setAssigningProduitId(null);
    }
  };

  return (
    <div className="page-card">
      <Type120AdminNav />

      {error ? <div className="alert alert-warning page-alert">{error}</div> : null}
      {message ? <div className="alert alert-success page-alert">{message}</div> : null}

      <section className="workflow-card">
        <div className="request-list__header">
          <div>
            <h3>Produits disponibles</h3>
            <p className="page-muted">Affichage trie et transfert par quantite vers un departement cible.</p>
          </div>
        </div>

        <div className="row" style={{ marginBottom: 12 }}>
          <div className="col-md-8">
            <label className="form-label">Recherche</label>
            <input className="form-control" name="search" value={filters.search} onChange={handleFilterChange} placeholder="Nom, ID, departement..." />
          </div>
          <div className="col-md-4">
            <label className="form-label">Filtre departement</label>
            <select className="form-control" name="departmentId" value={filters.departmentId} onChange={handleFilterChange}>
              <option value="">Tous</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>{department.nom}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="row">
          <div className="col-md-7" style={{ marginBottom: 12 }}>
            <h4 style={{ marginTop: 0 }}>Transfert actif (stock central)</h4>
            <div className="table-responsive">
              <table className="table table-striped table-bordered table-sm">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nom</th>
                    <th>Prix</th>
                    <th>Stock dispo</th>
                    <th>Transfert</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" className="text-center">Chargement...</td></tr>
                  ) : centralProduits.length === 0 ? (
                    <tr><td colSpan="5" className="text-center">Aucun stock central disponible.</td></tr>
                  ) : (
                    centralProduits.map((produit) => {
                      const selectedDepartmentId = assignmentByProduit[produit.id] || "";
                      const selectedQuantite = quantityByProduit[produit.id] || "1";

                      return (
                        <tr key={produit.id}>
                          <td>{produit.id}</td>
                          <td>{produit.nom || "-"}</td>
                          <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>{formatPrice(produit.prix)}</td>
                          <td>{produit.stockDisponible ?? 0}</td>
                          <td>
                            <div style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 320, flexWrap: "nowrap" }}>
                              <input
                                type="number"
                                min="1"
                                className="form-control"
                                style={{ width: 86 }}
                                value={selectedQuantite}
                                onChange={(event) =>
                                  handleProduitQuantityChange(produit.id, event.target.value)
                                }
                              />
                              <select
                                className="form-control"
                                style={{ minWidth: 150 }}
                                value={selectedDepartmentId}
                                onChange={(event) => handleProduitDepartmentSelect(produit.id, event.target.value)}
                              >
                                <option value="">Choisir...</option>
                                {departments.map((department) => (
                                  <option key={department.id} value={department.id}>{department.nom}</option>
                                ))}
                              </select>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleAssignProduitDepartment(produit)}
                                disabled={assigningProduitId === produit.id}
                                style={{ whiteSpace: "nowrap" }}
                              >
                                {assigningProduitId === produit.id ? "..." : "Transferer"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-md-5" style={{ marginBottom: 12 }}>
            <h4 style={{ marginTop: 0 }}>Historique transferts (bloque)</h4>
            <div className="table-responsive">
              <table className="table table-striped table-bordered table-sm">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nom</th>
                    <th>Departement</th>
                    <th>Stock dispo</th>
                    <th>Etat</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" className="text-center">Chargement...</td></tr>
                  ) : historiqueProduits.length === 0 ? (
                    <tr><td colSpan="5" className="text-center">Aucun historique.</td></tr>
                  ) : (
                    historiqueProduits.map((produit) => (
                      <tr key={produit.id}>
                        <td>{produit.id}</td>
                        <td>{produit.nom || "-"}</td>
                        <td>{`${produit.department?.id || "-"} - ${produit.department?.nom || "-"}`}</td>
                        <td>{produit.stockDisponible ?? 0}</td>
                        <td>Bloque</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
