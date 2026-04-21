import { useContext, useEffect, useMemo, useState } from "react";
import { getAcceptedProformas } from "../../api/proformaApi";
import { createLivraison } from "../../api/livraisonApi";
import { MiniBarChart, StatGrid, formatMga } from "../../components/StatsWidgets";
import { AuthContext } from "../../context/AuthContext";

export default function Type80AcceptedPage() {
  const { user } = useContext(AuthContext);
  const [proformas, setProformas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedGroupKey, setSelectedGroupKey] = useState("");
  const [formData, setFormData] = useState({
    reference: "",
    date_livraison: "",
    commentaire: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

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

  const groupedProformas = useMemo(() => {
    const groups = new Map();

    proformas.forEach((proforma) => {
      const batchReference = proforma?.demande?.batchReference || null;
      const fournisseurId = proforma?.fournisseur?.id || "N/A";
      const key = batchReference
        ? `batch-${batchReference}-f-${fournisseurId}`
        : `proforma-${proforma.id}`;

      const produit = proforma?.demande?.produit || "-";
      const quantite = proforma?.demande?.quantite ?? "-";
      const existing = groups.get(key);

      if (existing) {
        existing.proformas.push(proforma);
        existing.proformaIds.push(proforma.id);
        existing.demandeIds.push(proforma?.demande?.id);
        existing.produits.push(`${produit} (${quantite})`);
        existing.totalPrix += Number(proforma?.prix || 0);
        if (!existing.delai && proforma?.delai != null) {
          existing.delai = proforma.delai;
        }
        return;
      }

      groups.set(key, {
        key,
        batchReference,
        fournisseur: proforma?.fournisseur || null,
        proformas: [proforma],
        proformaIds: [proforma.id],
        demandeIds: [proforma?.demande?.id],
        produits: [`${produit} (${quantite})`],
        totalPrix: Number(proforma?.prix || 0),
        delai: proforma?.delai,
      });
    });

    return Array.from(groups.values());
  }, [proformas]);

  const selectedGroup = useMemo(
    () => groupedProformas.find((group) => String(group.key) === selectedGroupKey),
    [groupedProformas, selectedGroupKey]
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
    { label: "Lots / fournisseurs", value: groupedProformas.length },
    { label: "Budget accepte", value: formatMga(totalBudget) },
    { label: "Fournisseurs", value: proformasByFournisseur.length },
  ];

  const formatDate = (value) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleDateString("fr-FR");
  };

  const getGroupLotLabel = (group) => group?.batchReference || `DA-${group?.demandeIds?.[0] || "-"}`;

  const getGroupProductsLabel = (group) => group?.produits?.join(", ") || "-";

  const getGroupDemandeLabel = (group) =>
    Array.isArray(group?.demandeIds) && group.demandeIds.length > 0
      ? group.demandeIds.join(", ")
      : "-";

  const getGroupProformaLabel = (group) =>
    Array.isArray(group?.proformaIds) && group.proformaIds.length > 0
      ? group.proformaIds.join(", ")
      : "-";

  const openLivraisonModal = (group) => {
    setSelectedGroupKey(String(group.key));
    setFormData({
      reference: `LIV-${group.batchReference || group.proformaIds?.[0] || Date.now()}-${Date.now()}`,
      date_livraison: new Date().toISOString().split("T")[0],
      commentaire: "",
    });
    setShowModal(true);
  };

  const closeLivraisonModal = () => {
    setShowModal(false);
    setSelectedGroupKey("");
    setFormData({
      reference: "",
      date_livraison: "",
      commentaire: "",
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateLivraison = async () => {
    if (!selectedGroup) return;

    try {
      setSubmitting(true);
      setError("");

      if (!user?.id) {
        setError("Utilisateur non connecté.");
        setSubmitting(false);
        return;
      }

      await Promise.all(
        selectedGroup.proformas.map((proforma) =>
          createLivraison({
            idProforma: proforma.id,
            userId: user.id,
            reference: `${formData.reference || `LIV-${selectedGroup.batchReference || selectedGroup.proformaIds?.[0] || Date.now()}`}-${proforma.id}`,
            date_livraison: formData.date_livraison + "T00:00:00",
            commentaire: formData.commentaire,
          })
        )
      );

      setSuccessMsg(
        `Livraison créée pour le lot ${getGroupLotLabel(selectedGroup)} et le fournisseur ${selectedGroup.fournisseur?.nom || "-"}.`
      );
      setProformas((prev) => prev.filter((item) => !selectedGroup.proformaIds.includes(item.id)));
        setTimeout(() => setSuccessMsg(""), 3000);
        closeLivraisonModal();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur serveur");
    } finally {
      setSubmitting(false);
    }
  };

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
      {successMsg ? <div className="alert alert-success page-alert">{successMsg}</div> : null}

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
              <th>Lot</th>
              <th>Fournisseur</th>
              <th>Demande(s)</th>
              <th>Produit / Quantite</th>
              <th>Date</th>
              <th>Prix total</th>
              <th>Delai</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" className="text-center">Chargement...</td>
              </tr>
            ) : groupedProformas.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center">Aucune proforma acceptee.</td>
              </tr>
            ) : (
              groupedProformas.map((group) => (
                <tr key={group.key}>
                  <td>{group.proformaIds.join(", ")}</td>
                  <td>{getGroupLotLabel(group)}</td>
                  <td>{group.fournisseur?.nom || `ID ${group.fournisseur?.id || "-"}`}</td>
                  <td>{getGroupDemandeLabel(group)}</td>
                  <td>{getGroupProductsLabel(group)}</td>
                  <td>{formatDate(group.proformas[0]?.demande?.dateCreation)}</td>
                  <td>{formatMga(group.totalPrix)}</td>
                  <td>{group.delai ?? "-"}</td>
                  <td>{group.proformas[0]?.statut || "-"}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => openLivraisonModal(group)}
                    >
                      Créer Livraison
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Livraison */}
      {showModal && (
        <div className="modal-overlay" onClick={closeLivraisonModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Créer Livraison</h3>
              <button type="button" className="close" onClick={closeLivraisonModal}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              {selectedGroup && (
                <div className="form-group mb-3">
                  <label className="form-label">Groupe:</label>
                  <div className="alert alert-info">
                    Lot: {getGroupLotLabel(selectedGroup)} | Fournisseur: {selectedGroup.fournisseur?.nom} | Demandes: {getGroupDemandeLabel(selectedGroup)} | Produits: {getGroupProductsLabel(selectedGroup)} | Proforma(s): {getGroupProformaLabel(selectedGroup)} | Prix total: {formatMga(selectedGroup.totalPrix)}
                  </div>
                </div>
              )}

              <div className="form-group mb-3">
                <label className="form-label">Référence:</label>
                <input
                  type="text"
                  className="form-control"
                  name="reference"
                  value={formData.reference}
                  onChange={handleFormChange}
                  placeholder="Ex: LIV-001"
                />
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Date de Livraison:</label>
                <input
                  type="date"
                  className="form-control"
                  name="date_livraison"
                  value={formData.date_livraison}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Commentaire:</label>
                <textarea
                  className="form-control"
                  name="commentaire"
                  value={formData.commentaire}
                  onChange={handleFormChange}
                  rows="3"
                  placeholder="Ajouter un commentaire..."
                />
              </div>

              {error && <div className="alert alert-danger">{error}</div>}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeLivraisonModal}
                disabled={submitting}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCreateLivraison}
                disabled={submitting}
              >
                {submitting ? "Création..." : "Créer Livraison"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
