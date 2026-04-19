import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { getEnterpriseLivraisons, markLivraisonLivree } from "../../api/livraisonApi";
import { createFactureFromLivraison, getEnterpriseFactures } from "../../api/factureApi";
import { MiniBarChart, StatGrid, formatMga } from "../../components/StatsWidgets";
import { generateFactureLotPdf } from "../../utils/facturePdf";

export default function Type60Page() {
  const { user } = useContext(AuthContext);
  const [livraisons, setLivraisons] = useState([]);
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState(null);
  const [exportingId, setExportingId] = useState(null);

  const loadData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setError("Utilisateur non connecté.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [livraisonRes, factureRes] = await Promise.allSettled([
        getEnterpriseLivraisons(user.id),
        getEnterpriseFactures(user.id),
      ]);

      const livraisonData = livraisonRes.status === "fulfilled" ? livraisonRes.value?.data?.data : [];
      const factureData = factureRes.status === "fulfilled" ? factureRes.value?.data?.data : [];

      setLivraisons(Array.isArray(livraisonData) ? livraisonData : []);
      setFactures(Array.isArray(factureData) ? factureData : []);

      const livraisonError = livraisonRes.status === "rejected"
        ? livraisonRes.reason?.response?.data?.message || ""
        : "";
      const factureError = factureRes.status === "rejected"
        ? factureRes.reason?.response?.data?.message || ""
        : "";

      if (livraisonError || factureError) {
        setError([livraisonError, factureError].filter(Boolean).join(" | "));
      }
    } catch (loadError) {
      setError(loadError?.response?.data?.message || "Impossible de charger les donnees.");
      setLivraisons([]);
      setFactures([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const deliveryStats = useMemo(() => {
    const total = livraisons.length;
    const livrees = livraisons.filter((item) => String(item?.statut || "").toUpperCase() === "LIVREE").length;
    const enCours = livraisons.filter((item) => String(item?.statut || "").toUpperCase() === "EN_COURS").length;
    const brouillons = livraisons.filter((item) => String(item?.statut || "").toUpperCase() === "BROUILLON").length;

    return [
      { label: "Livraisons", value: total },
      { label: "Livrees", value: livrees },
      { label: "En cours", value: enCours },
      { label: "Brouillon", value: brouillons },
    ];
  }, [livraisons]);

  const deliveryChart = useMemo(() => {
    const counter = new Map();
    livraisons.forEach((livraison) => {
      const statut = String(livraison?.statut || "SANS_STATUT");
      counter.set(statut, (counter.get(statut) || 0) + 1);
    });
    return Array.from(counter.entries()).map(([label, value]) => ({ label, value }));
  }, [livraisons]);

  const factureStats = useMemo(() => {
    const total = factures.length;
    const emises = factures.filter((item) => String(item?.statut || "").toUpperCase() === "EMISE").length;
    const payees = factures.filter((item) => String(item?.statut || "").toUpperCase() === "PAYEE").length;
    const totalTtc = factures.reduce((sum, facture) => sum + Number(facture?.montantTtc || 0), 0);

    return [
      { label: "Factures", value: total },
      { label: "Emises", value: emises },
      { label: "Payees", value: payees },
      { label: "Total TTC", value: formatMga(totalTtc) },
    ];
  }, [factures]);

  const groupedFactures = useMemo(() => {
    const groups = new Map();

    factures.forEach((facture) => {
      const livraison = facture?.livraison || null;
      const clientId = facture?.client?.id || "N/A";
      const batchReference = livraison?.proforma?.demande?.batchReference || null;
      const referenceRoot = String(livraison?.reference || livraison?.id || "-").replace(/-\d+$/, "");
      const lotLabel = batchReference || referenceRoot;
      const key = `lot-${lotLabel}-client-${clientId}`;

      const produit = livraison?.proforma?.demande?.produit || "-";
      const quantite = Number(livraison?.proforma?.demande?.quantite || 0);

      const existing = groups.get(key);
      if (existing) {
        existing.factures.push(facture);
        existing.factureIds.push(facture.id);
        existing.references.push(facture.reference || "-");
        existing.livraisonIds.push(livraison?.id || "-");
        existing.produits.push(`${produit} (${quantite || "-"})`);
        existing.totalMontantTtc += Number(facture?.montantTtc || 0);
        existing.statuses.push(String(facture?.statut || "-"));
        return;
      }

      groups.set(key, {
        key,
        lotLabel,
        clientNom: facture?.client?.nom || "-",
        factures: [facture],
        factureIds: [facture.id],
        references: [facture.reference || "-"],
        livraisonIds: [livraison?.id || "-"],
        produits: [`${produit} (${quantite || "-"})`],
        totalMontantTtc: Number(facture?.montantTtc || 0),
        statuses: [String(facture?.statut || "-")],
      });
    });

    return Array.from(groups.values());
  }, [factures]);

  const groupedLivraisons = useMemo(() => {
    const groups = new Map();

    livraisons.forEach((livraison) => {
      const entrepriseId = livraison?.entreprise?.id || "N/A";
      const batchReference = livraison?.proforma?.demande?.batchReference || null;
      const referenceRoot = String(livraison?.reference || livraison?.id || "-").replace(/-\d+$/, "");
      const lotLabel = batchReference || referenceRoot;
      const key = `lot-${lotLabel}-ent-${entrepriseId}`;

      const produit = livraison?.proforma?.demande?.produit || "-";
      const quantite = Number(livraison?.proforma?.demande?.quantite || 0);

      const existing = groups.get(key);
      if (existing) {
        existing.livraisons.push(livraison);
        existing.ids.push(livraison.id);
        existing.references.push(livraison.reference || "-");
        existing.commandeIds.push(livraison?.commande?.id || "-");
        existing.quantiteTotale += quantite;
        existing.produits.push(`${produit} (${quantite || "-"})`);
        return;
      }

      groups.set(key, {
        key,
        lotLabel,
        entrepriseNom: livraison?.entreprise?.nom || "-",
        date: livraison?.dateLivraison || livraison?.dateCreation || "-",
        livraisons: [livraison],
        ids: [livraison.id],
        references: [livraison.reference || "-"],
        commandeIds: [livraison?.commande?.id || "-"],
        quantiteTotale: quantite,
        produits: [`${produit} (${quantite || "-"})`],
      });
    });

    return Array.from(groups.values());
  }, [livraisons]);

  const getGroupStatut = (group) => {
    const statuts = (group?.livraisons || []).map((item) => String(item?.statut || "").toUpperCase());
    if (statuts.length === 0) return "-";
    if (statuts.every((s) => s === "LIVREE")) return "LIVREE";
    if (statuts.some((s) => s === "EN_COURS")) return "EN_COURS";
    if (statuts.some((s) => s === "BROUILLON")) return "BROUILLON";
    return Array.from(new Set(statuts)).join(", ");
  };

  const handleLivree = async (group) => {
    if (!user?.id) {
      setError("Utilisateur non connecté.");
      return;
    }

    try {
      setWorkingId(group.key);
      setMessage("");
      setError("");

      await Promise.all(
        group.livraisons
          .filter((livraison) => {
            const statut = String(livraison?.statut || "").toUpperCase();
            return statut === "BROUILLON" || statut === "EN_COURS";
          })
          .map((livraison) =>
            markLivraisonLivree(livraison.id, {
              userId: user.id,
            })
          )
      );

      setMessage(`Lot ${group.lotLabel} marque LIVREE.`);
      await loadData();
    } catch (stateError) {
      setError(stateError?.response?.data?.message || stateError.message || "Erreur lors du changement d'etat.");
    } finally {
      setWorkingId(null);
    }
  };

  const handleCreateFacture = async (group) => {
    if (!user?.id) {
      setError("Utilisateur non connecté.");
      return;
    }

    try {
      setWorkingId(group.key);
      setMessage("");
      setError("");

      const factureByLivraisonId = new Set(
        factures
          .map((facture) => Number(facture?.livraison?.id || facture?.livraisonId || 0))
          .filter((id) => Number.isFinite(id) && id > 0)
      );

      const livraisonsEligibles = group.livraisons.filter((livraison) => {
        const statut = String(livraison?.statut || "").toUpperCase();
        return statut === "LIVREE" && !factureByLivraisonId.has(Number(livraison.id));
      });

      if (livraisonsEligibles.length === 0) {
        setMessage("Aucune livraison du lot n'est eligible a la facturation.");
        return;
      }

      const responses = await Promise.all(
        livraisonsEligibles.map((livraison) =>
          createFactureFromLivraison({ livraisonId: livraison.id, userId: user.id })
        )
      );

      const createdFactures = responses
        .map((response) => response?.data?.data)
        .filter(Boolean);

      if (createdFactures.length > 0) {
        generateFactureLotPdf(createdFactures, user?.entreprise?.nom || "Entreprise", group.lotLabel);
      }

      setMessage(`Facture(s) creee(s) pour le lot ${group.lotLabel}.`);

      await loadData();
    } catch (invoiceError) {
      setError(invoiceError?.response?.data?.message || "Erreur lors de la création de facture.");
    } finally {
      setWorkingId(null);
    }
  };

  const handleExportFactureGroup = async (group) => {
    try {
      setExportingId(group.key);
      setMessage("");
      setError("");

      generateFactureLotPdf(group.factures, user?.entreprise?.nom || "Entreprise", group.lotLabel);

      setMessage(`PDF unique exporte pour le lot ${group.lotLabel} (${group.factures.length} facture(s)).`);
    } catch (exportError) {
      setError(exportError?.message || "Erreur lors de l'export PDF.");
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div className="page-card">
      <div className="page-card__header">
        <div>
          <p className="page-eyebrow">Score 60</p>
          <h2>Gestion Livraison et Facturation</h2>
        </div>
        <p className="page-muted">Changement d'etat livraison puis creation facture.</p>
      </div>

      {message ? <div className="alert alert-success page-alert">{message}</div> : null}
      {error ? <div className="alert alert-warning page-alert">{error}</div> : null}

      <StatGrid items={deliveryStats} />
      <MiniBarChart
        title="Livraisons par statut"
        data={deliveryChart}
        emptyLabel="Aucune livraison disponible."
      />

      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead>
            <tr>
              <th>ID</th>
              <th>Lot</th>
              <th>Reference</th>
              <th>Commande</th>
              <th>Produit</th>
              <th>Quantite</th>
              <th>Entreprise</th>
              <th>Date</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" className="text-center">Chargement...</td>
              </tr>
            ) : groupedLivraisons.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center">Aucune livraison trouvee pour cette entreprise.</td>
              </tr>
            ) : (
              groupedLivraisons.map((group) => {
                const statut = getGroupStatut(group);
                const canMarkLivree = group.livraisons.some((livraison) => {
                  const rowStatut = String(livraison?.statut || "").toUpperCase();
                  return rowStatut === "BROUILLON" || rowStatut === "EN_COURS";
                });
                const canCreateFacture = group.livraisons.some(
                  (livraison) => String(livraison?.statut || "").toUpperCase() === "LIVREE"
                );

                return (
                  <tr key={group.key}>
                    <td>{group.ids.join(", ")}</td>
                    <td>{group.lotLabel}</td>
                    <td>{group.references.join(", ")}</td>
                    <td>{Array.from(new Set(group.commandeIds)).join(", ")}</td>
                    <td>{Array.from(new Set(group.produits)).join(", ")}</td>
                    <td>{group.quantiteTotale}</td>
                    <td>{group.entrepriseNom}</td>
                    <td>{group.date}</td>
                    <td>{statut}</td>
                    <td>
                      <div className="d-flex gap-2 flex-wrap">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleLivree(group)}
                          disabled={!canMarkLivree || workingId === group.key}
                        >
                          {workingId === group.key ? "Traitement..." : "Marquer LIVREE"}
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleCreateFacture(group)}
                          disabled={!canCreateFacture || workingId === group.key}
                        >
                          Creer facture
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

      <div className="page-card__header" style={{ marginTop: 24 }}>
        <div>
          <p className="page-eyebrow">Factures</p>
          <h2>Factures de l'entreprise</h2>
        </div>
        <p className="page-muted">Liste synchronisee apres creation de facture.</p>
      </div>

      <StatGrid items={factureStats} />

      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead>
            <tr>
              <th>ID</th>
              <th>Lot</th>
              <th>Reference</th>
              <th>Livraison</th>
              <th>Produit / Quantite</th>
              <th>Client</th>
              <th>Montant TTC</th>
              <th>Statut</th>
              <th>Export</th>
            </tr>
          </thead>
          <tbody>
            {groupedFactures.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center">Aucune facture generee.</td>
              </tr>
            ) : (
              groupedFactures.map((group) => (
                <tr key={group.key}>
                  <td>{group.factureIds.join(", ")}</td>
                  <td>{group.lotLabel}</td>
                  <td>{Array.from(new Set(group.references)).join(", ")}</td>
                  <td>{Array.from(new Set(group.livraisonIds)).join(", ")}</td>
                  <td>{Array.from(new Set(group.produits)).join(", ")}</td>
                  <td>{group.clientNom}</td>
                  <td>{formatMga(group.totalMontantTtc)}</td>
                  <td>{Array.from(new Set(group.statuses)).join(", ")}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => handleExportFactureGroup(group)}
                      disabled={exportingId === group.key}
                    >
                      {exportingId === group.key ? "Export..." : `Exporter PDF (${group.factures.length})`}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}