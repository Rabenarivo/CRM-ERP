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
  const [selectedLotKey, setSelectedLotKey] = useState("");
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

  const groupedDemandes = useMemo(() => {
    const groups = new Map();

    demandes.forEach((demande) => {
      const key = demande?.batchReference
        ? `batch-${demande.batchReference}`
        : `single-${demande.id}`;
      const existing = groups.get(key);

      if (existing) {
        existing.items.push(demande);
        existing.totalQuantite += Number(demande?.quantite || 0);
      } else {
        groups.set(key, {
          key,
          batchReference: demande?.batchReference || null,
          items: [demande],
          totalQuantite: Number(demande?.quantite || 0),
        });
      }
    });

    return Array.from(groups.values()).sort((a, b) => {
      const dateA = new Date(a.items[0]?.dateCreation || 0).getTime();
      const dateB = new Date(b.items[0]?.dateCreation || 0).getTime();
      return dateB - dateA;
    });
  }, [demandes]);

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

  const selectedLot = groupedDemandes.find((lot) => String(lot.key) === String(selectedLotKey));

  const handleCheckStock = async () => {
    if (!selectedLot || selectedLot.items.length === 0) {
      setStockResult(null);
      return;
    }

    setError("");
    setCheckingStock(true);

    try {
      const checks = await Promise.all(
        selectedLot.items.map(async (demande) => {
          const demandeProduitName = normalizeName(demande?.produit);
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
            (produit) => Number(produit?.stock ?? produit?.stockDisponible ?? 0) > 0
          );

          const produitTrouve = produitCompatibleTrouve || produits.find(
            (produit) => Number(produit?.stock ?? produit?.stockDisponible ?? 0) > 0
          );

          return {
            demandeId: demande.id,
            produitDemande: demande.produit,
            quantiteDemande: demande.quantite,
            available: Boolean(produitTrouve),
            produitStock: produitTrouve || null,
          };
        })
      );

      const stockDisponible = checks.some((check) => check.available);

      setStockResult({
        checks,
        available: stockDisponible,
        allUnavailable: !stockDisponible,
        message: stockDisponible
          ? "Au moins un produit est disponible en stock."
          : "Stock = 0 pour tous les produits du lot. Vous pouvez envoyer la demande d'achat.",
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

    if (!selectedLot || selectedLot.items.length === 0) {
      setOffreMessage("Selectionnez un lot de demande d'achat.");
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
        description: offreDraft.description || `Offre envoyee pour le lot ${selectedLot.batchReference || selectedLot.key}`,
        validite: offreDraft.validite || null,
      };

      await Promise.all(
        selectedFournisseurIds.flatMap((fournisseurId) =>
          selectedLot.items.map((demande) =>
            createOffre({
              demandeId: demande.id,
              fournisseurId: Number(fournisseurId),
              offre: {
                ...payload,
                description:
                  offreDraft.description ||
                  `Offre envoyee pour ${demande.produit} (lot ${selectedLot.batchReference || selectedLot.key})`,
              },
            })
          )
        )
      );

      await Promise.all(
        selectedLot.items.map((demande) => updateDemandeAchatStatut(demande.id, "ENVOYE"))
      );

      const idsToRemove = new Set(selectedLot.items.map((demande) => String(demande.id)));

      setDemandes((currentDemandes) =>
        currentDemandes.filter((demande) => !idsToRemove.has(String(demande.id)))
      );
      setSelectedLotKey("");
      setStockResult(null);
      setSelectedFournisseurIds([]);
      setOffreDraft({
        reference: "",
        delaiLivraison: "",
        description: "",
        validite: "",
      });
      setOffreMessage(
        `Lot ${selectedLot.batchReference || selectedLot.key} envoye avec succes a ${selectedFournisseurIds.length} fournisseurs.`
      );
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
          ) : groupedDemandes.length === 0 ? (
            <p className="page-muted">Aucune demande disponible.</p>
          ) : (
            <div className="workflow-list">
              {groupedDemandes.map((lot) => {
                const isActive = String(lot.key) === String(selectedLotKey);
                const produitsResume = lot.items
                  .map((demande) => `${demande.produit} (${demande.quantite})`)
                  .join(", ");
                return (
                  <button
                    key={lot.key}
                    type="button"
                    className={`workflow-item btn btn-default${isActive ? " workflow-item--active" : ""}`}
                    onClick={() => {
                      setSelectedLotKey(String(lot.key));
                      setStockResult(null);
                      setSelectedFournisseurIds([]);
                      setOffreMessage("");
                    }}
                  >
                    <strong>
                      {lot.batchReference ? `Lot ${lot.batchReference}` : `Demande #${lot.items[0]?.id || "-"}`}
                    </strong>
                    <span>Lignes: {lot.items.length} · Quantite totale: {lot.totalQuantite}</span>
                    <span>{produitsResume}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="workflow-card">
          <h3>Etape 2: Verification stock produit</h3>
          {!selectedLot ? (
            <p className="page-muted">Selectionnez un lot pour commencer.</p>
          ) : (
            <>
              <p className="page-muted">
                {selectedLot.batchReference
                  ? `Lot en cours: ${selectedLot.batchReference}`
                  : `Demande #${selectedLot.items[0]?.id || "-"}`}
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
                    <strong>Au moins un produit du lot est disponible en stock</strong>
                    {stockResult.checks.map((check) => (
                      <p key={check.demandeId}>
                        {check.produitDemande}: {check.available ? `Stock ${check.produitStock?.stock ?? check.produitStock?.stockDisponible ?? 0}` : "Stock 0"}
                      </p>
                    ))}
                  </div>
                ) : (
                  <div className="workflow-result workflow-result--ko alert alert-danger">
                    <strong>{stockResult.message}</strong>
                    {stockResult.checks.map((check) => (
                      <p key={check.demandeId}>
                        {check.produitDemande}: Stock 0
                      </p>
                    ))}
                  </div>
                )
              ) : null}
            </>
          )}
        </section>

        <section className="workflow-card">
          <h3>Etape 3: Envoyer la demande d'achat (2 minimum)</h3>

          {!selectedLot ? (
            <p className="page-muted">Selectionnez d'abord un lot.</p>
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
              <div className="alert alert-info">
                <strong>Envoi autorise:</strong> la demande d'achat peut etre envoyee meme si un seul produit du lot est disponible en stock, ou si aucun n'est disponible.
              </div>

              {stockResult ? (
                <p className="page-muted">
                  {stockResult.available
                    ? "Au moins un produit du lot est disponible en stock."
                    : "Aucun produit du lot n'est disponible en stock."}
                </p>
              ) : (
                <p className="page-muted">La verification du stock reste facultative avant l'envoi.</p>
              )}

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
