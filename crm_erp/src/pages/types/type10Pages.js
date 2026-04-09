import { useEffect, useState } from "react";
import { getDemandesAchat } from "../../api/demandeAchatApi";
import { filterProduitsByName } from "../../api/produitApi";

const normalizeName = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

export default function Type10Page() {
  const [demandes, setDemandes] = useState([]);
  const [selectedDemandeId, setSelectedDemandeId] = useState("");
  const [loadingDemandes, setLoadingDemandes] = useState(true);
  const [checkingStock, setCheckingStock] = useState(false);
  const [stockResult, setStockResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDemandes = async () => {
      try {
        const response = await getDemandesAchat();
        setDemandes(Array.isArray(response.data) ? response.data : []);
      } catch (loadError) {
        setError("Impossible de charger la liste des demandes d'achat.");
      } finally {
        setLoadingDemandes(false);
      }
    };

    loadDemandes();
  }, []);

  const selectedDemande = demandes.find(
    (demande) => String(demande.id) === String(selectedDemandeId)
  );

  const handleCheckStock = async () => {
    if (!selectedDemande?.produit) {
      setStockResult(null);
      return;
    }

    setError("");
    setCheckingStock(true);

    try {
      const demandeProduitName = normalizeName(selectedDemande.produit);
      const response = await filterProduitsByName(demandeProduitName);
      const produits = Array.isArray(response.data) ? response.data : [];
      const produitsCompatibles = produits.filter((produit) => {
        const produitName = normalizeName(produit?.nom);
        return (
          produitName.includes(demandeProduitName) ||
          demandeProduitName.includes(produitName)
        );
      });

      const produitCompatibleTrouve = produitsCompatibles.find(
        (produit) => Number(produit?.stock ?? 0) > 0
      );

      const produitTrouve = produitCompatibleTrouve || produits.find(
        (produit) => Number(produit?.stock ?? 0) > 0
      );

      if (!produitTrouve) {
        setStockResult({
          available: false,
          message: "Stock non disponible",
        });
        return;
      }

      setStockResult({
        available: true,
        produit: produitTrouve,
      });
    } catch (checkError) {
      setStockResult(null);
      setError("Erreur pendant la verification de stock.");
    } finally {
      setCheckingStock(false);
    }
  };

  return (
    <div className="page-card">
      <div className="page-card__header">
        <div>
          <p className="page-eyebrow">Score 10</p>
          <h2>Workflow Demande d'achat</h2>
        </div>
        <p className="page-muted">
          Selectionner une demande a traiter puis verifier la disponibilite en stock.
        </p>
      </div>

      {error ? <div className="page-alert">{error}</div> : null}

      <div className="workflow-grid">
        <section className="workflow-card">
          <h3>Etape 1: Liste des demandes d'achat</h3>
          {loadingDemandes ? (
            <p className="page-muted">Chargement...</p>
          ) : demandes.length === 0 ? (
            <p className="page-muted">Aucune demande disponible.</p>
          ) : (
            <div className="workflow-list">
              {demandes.map((demande) => {
                const isActive = String(demande.id) === String(selectedDemandeId);
                return (
                  <button
                    key={demande.id}
                    type="button"
                    className={`workflow-item${isActive ? " workflow-item--active" : ""}`}
                    onClick={() => {
                      setSelectedDemandeId(String(demande.id));
                      setStockResult(null);
                    }}
                  >
                    <strong>#{demande.id} - {demande.produit}</strong>
                    <span>Quantite demandee: {demande.quantite}</span>
                    <span>Statut: {demande.statut || "-"}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="workflow-card">
          <h3>Etape 2: Verification stock produit</h3>
          {!selectedDemande ? (
            <p className="page-muted">Selectionnez une demande pour commencer.</p>
          ) : (
            <>
              <p className="page-muted">
                Produit demande: <strong>{selectedDemande.produit}</strong>
              </p>

              <button
                type="button"
                className="workflow-check-btn"
                onClick={handleCheckStock}
                disabled={checkingStock}
              >
                {checkingStock ? "Verification..." : "Verifier le stock"}
              </button>

              {stockResult ? (
                stockResult.available ? (
                  <div className="workflow-result workflow-result--ok">
                    <strong>Produit disponible en stock</strong>
                    <p>Produit: {stockResult.produit.nom}</p>
                    <p>Stock actuel: {stockResult.produit.stock}</p>
                  </div>
                ) : (
                  <div className="workflow-result workflow-result--ko">
                    <strong>{stockResult.message}</strong>
                  </div>
                )
              ) : null}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
