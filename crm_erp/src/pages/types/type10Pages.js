import { useEffect, useMemo, useState } from "react";
import { getDemandesAchat } from "../../api/demandeAchatApi";
import { updateDemandeAchatStatut } from "../../api/demandeAchatApi";
import { filterProduitsByName } from "../../api/produitApi";
import { getFournisseurs } from "../../api/fournisseurApi";
import { createOffre } from "../../api/offreApi";
import { MiniBarChart, StatGrid } from "../../components/StatsWidgets";

const normalizeName = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const isDemandPending = (demande) => {
  const statut = normalizeName(demande?.statut);
  return !statut || statut === "en_cours";
};

export default function Type10Page() {
  const [demandes, setDemandes] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [selectedDemandeId, setSelectedDemandeId] = useState("");
  const [loadingDemandes, setLoadingDemandes] = useState(true);
  const [loadingFournisseurs, setLoadingFournisseurs] = useState(true);
  const [fournisseurError, setFournisseurError] = useState("");
  const [checkingStock, setCheckingStock] = useState(false);
  const [sendingOffres, setSendingOffres] = useState(false);
  const [stockResult, setStockResult] = useState(null);
  const [selectedFournisseurIds, setSelectedFournisseurIds] = useState([]);
  const [offreDraft, setOffreDraft] = useState({
    reference: "",
    delaiLivraison: "",
    description: "",
    validite: "",
  });
  const [error, setError] = useState("");
  const [offreMessage, setOffreMessage] = useState("");

  const totalQuantite = useMemo(
    () => demandes.reduce((sum, demande) => sum + Number(demande?.quantite || 0), 0),
    [demandes]
  );

  const demandesByProduit = useMemo(() => {
    const counter = new Map();
    demandes.forEach((demande) => {
      const produit = String(demande?.produit || "Produit inconnu");
      counter.set(produit, (counter.get(produit) || 0) + Number(demande?.quantite || 0));
    });
    return Array.from(counter.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [demandes]);

  const statCards = [
    { label: "Demandes a verifier", value: demandes.length },
    { label: "Quantite totale", value: totalQuantite },
    { label: "Fournisseurs selectionnes", value: selectedFournisseurIds.length },
    { label: "Fournisseurs disponibles", value: fournisseurs.length },
  ];

  useEffect(() => {
    const loadDemandes = async () => {
      try {
        const response = await getDemandesAchat();
        const pendingDemandes = Array.isArray(response.data)
          ? response.data.filter(isDemandPending)
          : [];
        setDemandes(pendingDemandes);
      } catch (loadError) {
        setError("Impossible de charger la liste des demandes d'achat.");
      } finally {
        setLoadingDemandes(false);
      }
    };

    loadDemandes();
  }, []);

  const loadFournisseurs = async () => {
    setLoadingFournisseurs(true);
    setFournisseurError("");

    try {
      const response = await getFournisseurs();
      setFournisseurs(Array.isArray(response.data) ? response.data : []);
    } catch (loadError) {
      setFournisseurs([]);
      setFournisseurError("Impossible de charger la liste des fournisseurs.");
    } finally {
      setLoadingFournisseurs(false);
    }
  };

  useEffect(() => {
    loadFournisseurs();
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
          message: "Stock = 0. Vous pouvez envoyer la demande d'achat.",
        });
        return;
      }

      setStockResult({
        available: true,
        produit: produitTrouve,
      });
      setOffreMessage("");
    } catch (checkError) {
      setStockResult(null);
      setError("Erreur pendant la verification de stock.");
    } finally {
      setCheckingStock(false);
    }
  };

  const toggleFournisseur = (fournisseurId) => {
    setSelectedFournisseurIds((current) => {
      const idAsString = String(fournisseurId);
      return current.includes(idAsString)
        ? current.filter((id) => id !== idAsString)
        : [...current, idAsString];
    });
  };

  const handleOffreFieldChange = (event) => {
    const { name, value } = event.target;
    setOffreDraft((current) => ({ ...current, [name]: value }));
  };

  const handleEnvoyerOffres = async () => {
    setOffreMessage("");

    if (!selectedDemande) {
      setOffreMessage("Selectionnez une demande d'achat.");
      return;
    }

    if (!stockResult || stockResult.available) {
      setOffreMessage("Verifiez d'abord que le stock est egal a 0 pour envoyer la demande d'achat.");
      return;
    }

    if (selectedFournisseurIds.length < 2) {
      setOffreMessage("Selectionnez au minimum 2 fournisseurs.");
      return;
    }

    setSendingOffres(true);

    try {
      const payload = {
        reference: offreDraft.reference || `OFFRE-${Date.now()}`,
        delaiLivraison: offreDraft.delaiLivraison ? Number(offreDraft.delaiLivraison) : 0,
        description: offreDraft.description || `Offre envoyee pour ${selectedDemande.produit}`,
        validite: offreDraft.validite || null,
      };

      await Promise.all(
        selectedFournisseurIds.map((fournisseurId) =>
          createOffre({
            demandeId: selectedDemande.id,
            fournisseurId: Number(fournisseurId),
            offre: payload,
          })
        )
      );

      await updateDemandeAchatStatut(selectedDemande.id, "ENVOYE");

      setDemandes((currentDemandes) =>
        currentDemandes.filter((demande) => String(demande.id) !== String(selectedDemande.id))
      );
      setSelectedDemandeId("");
      setStockResult(null);
      setSelectedFournisseurIds([]);
      setOffreDraft({
        reference: "",
        delaiLivraison: "",
        description: "",
        validite: "",
      });
      setOffreMessage(`Demande d'achat envoyee avec succes a ${selectedFournisseurIds.length} fournisseurs.`);
    } catch (sendError) {
      setOffreMessage(
        sendError?.response?.data || "Echec de l'envoi de la demande d'achat aux fournisseurs."
      );
    } finally {
      setSendingOffres(false);
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

      {error ? <div className="alert alert-warning page-alert">{error}</div> : null}

      <StatGrid items={statCards} />

      <MiniBarChart
        title="Top produits demandes"
        data={demandesByProduit}
        emptyLabel="Aucune demande en attente pour le magasinier."
      />

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
                    className={`workflow-item btn btn-default${isActive ? " workflow-item--active" : ""}`}
                    onClick={() => {
                      setSelectedDemandeId(String(demande.id));
                      setStockResult(null);
                      setSelectedFournisseurIds([]);
                      setOffreMessage("");
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
                className="workflow-check-btn btn btn-primary"
                onClick={handleCheckStock}
                disabled={checkingStock}
              >
                {checkingStock ? "Verification..." : "Verifier le stock"}
              </button>

              {stockResult ? (
                stockResult.available ? (
                  <div className="workflow-result workflow-result--ok alert alert-success">
                    <strong>Produit disponible en stock</strong>
                    <p>Produit: {stockResult.produit.nom}</p>
                    <p>Stock actuel: {stockResult.produit.stock}</p>
                  </div>
                ) : (
                  <div className="workflow-result workflow-result--ko alert alert-danger">
                    <strong>{stockResult.message}</strong>
                  </div>
                )
              ) : null}
            </>
          )}
        </section>

        <section className="workflow-card">
          <h3>Etape 3: Envoyer la demande d'achat (2 minimum)</h3>

          {!selectedDemande ? (
            <p className="page-muted">Selectionnez d'abord une demande.</p>
          ) : stockResult?.available ? (
            <p className="page-muted">Le stock est disponible. Une demande d'achat n'est envoyee que si le stock est egal a 0.</p>
          ) : !stockResult ? (
            <p className="page-muted">Verifiez d'abord le stock en etape 2.</p>
          ) : loadingFournisseurs ? (
            <p className="page-muted">Chargement des fournisseurs...</p>
          ) : fournisseurError ? (
            <div className="alert alert-warning">
              <p>{fournisseurError}</p>
              <button type="button" className="btn btn-default btn-sm" onClick={loadFournisseurs}>
                Recharger fournisseurs
              </button>
            </div>
          ) : fournisseurs.length === 0 ? (
            <div className="alert alert-info">
              <strong>Aucun fournisseur disponible.</strong>
              <p>Ajoute des fournisseurs via l'API backend puis recharge la liste.</p>
              <button type="button" className="btn btn-default btn-sm" onClick={loadFournisseurs}>
                Recharger fournisseurs
              </button>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="reference">Reference</label>
                <input
                  id="reference"
                  name="reference"
                  className="form-control"
                  value={offreDraft.reference}
                  onChange={handleOffreFieldChange}
                  placeholder="REF-2026-001"
                />
              </div>

              <div className="form-group">
                <label htmlFor="delaiLivraison">Delai livraison (jours)</label>
                <input
                  id="delaiLivraison"
                  name="delaiLivraison"
                  type="number"
                  min="0"
                  className="form-control"
                  value={offreDraft.delaiLivraison}
                  onChange={handleOffreFieldChange}
                  placeholder="7"
                />
              </div>

              <div className="form-group">
                <label htmlFor="validite">Date de validite</label>
                <input
                  id="validite"
                  name="validite"
                  type="date"
                  className="form-control"
                  value={offreDraft.validite}
                  onChange={handleOffreFieldChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  rows="3"
                  className="form-control"
                  value={offreDraft.description}
                  onChange={handleOffreFieldChange}
                  placeholder="Details de l'offre"
                />
              </div>

              <div className="workflow-list">
                {fournisseurs.map((fournisseur) => {
                  const fournisseurId = String(fournisseur.id);
                  const isChecked = selectedFournisseurIds.includes(fournisseurId);

                  return (
                    <label key={fournisseur.id} className="workflow-item fournisseur-item">
                      <span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFournisseur(fournisseur.id)}
                        />{" "}
                        <strong>{fournisseur.nom || `Fournisseur #${fournisseur.id}`}</strong>
                      </span>
                      <span>Contact: {fournisseur.contact || "-"}</span>
                    </label>
                  );
                })}
              </div>

              <p className="page-muted">
                Fournisseurs selectionnes: <strong>{selectedFournisseurIds.length}</strong> (minimum 2)
              </p>

              <button
                type="button"
                className="workflow-check-btn btn btn-success"
                onClick={handleEnvoyerOffres}
                disabled={sendingOffres}
              >
                {sendingOffres ? "Envoi en cours..." : "Envoyer la demande d'achat"}
              </button>

              {offreMessage ? (
                <div className="workflow-result alert alert-info">
                  <strong>{offreMessage}</strong>
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
