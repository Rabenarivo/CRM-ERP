import { useEffect, useMemo, useState } from "react";
import { getAllProformas, getProformaList, saveBonCommande } from "../../api/proformaApi";
import { getBonCommandes } from "../../api/bonCommandeApi";
import { MiniBarChart, StatGrid, formatMga } from "../../components/StatsWidgets";

export default function Type80Page() {
  const [proformas, setProformas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedGroupKey, setSelectedGroupKey] = useState("");
  const [decision, setDecision] = useState("ACCEPTEE");
  const [message, setMessage] = useState("");
  const [allProformas, setAllProformas] = useState([]);
  const [bonCommandes, setBonCommandes] = useState([]);

  const loadProformas = async () => {
    setLoading(true);
    try {
      const response = await getProformaList();
      setProformas(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setMessage("Impossible de charger les proformas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProformas();
  }, []);

  useEffect(() => {
    const loadAnalytics = async () => {
      const [proformasRes, bcRes] = await Promise.allSettled([
        getAllProformas(),
        getBonCommandes(),
      ]);

      setAllProformas(
        proformasRes.status === "fulfilled" && Array.isArray(proformasRes.value.data)
          ? proformasRes.value.data
          : []
      );
      setBonCommandes(
        bcRes.status === "fulfilled" && Array.isArray(bcRes.value.data)
          ? bcRes.value.data
          : []
      );
    };

    loadAnalytics();
  }, []);

  const groupedProformas = useMemo(() => {
    const groups = new Map();

    proformas.forEach((proforma) => {
      const batchReference = proforma?.demande?.batchReference || null;
      const fournisseurId = proforma?.fournisseur?.id || "N/A";
      const key = batchReference
        ? `batch-${batchReference}-f-${fournisseurId}`
        : `proforma-${proforma.id}`;

      const existing = groups.get(key);
      const produit = proforma?.demande?.produit || "-";
      const quantite = proforma?.demande?.quantite ?? "-";

      if (existing) {
        existing.proformas.push(proforma);
        existing.proformaIds.push(proforma.id);
        existing.totalPrix += Number(proforma?.prix || 0);
        existing.produits.push(`${produit} (${quantite})`);
        if (proforma?.demande?.id != null) {
          existing.demandeIds.push(proforma.demande.id);
        }
        return;
      }

      groups.set(key, {
        key,
        batchReference,
        fournisseur: proforma?.fournisseur || null,
        proformas: [proforma],
        proformaIds: [proforma.id],
        demandeIds: proforma?.demande?.id != null ? [proforma.demande.id] : [],
        totalPrix: Number(proforma?.prix || 0),
        delai: proforma?.delai,
        statut: proforma?.statut,
        produits: [`${produit} (${quantite})`],
      });
    });

    return Array.from(groups.values());
  }, [proformas]);

  const selectedGroup = useMemo(
    () => groupedProformas.find((group) => String(group.key) === selectedGroupKey),
    [groupedProformas, selectedGroupKey]
  );

  const pendingBudget = useMemo(
    () => proformas.reduce((sum, proforma) => sum + Number(proforma?.prix || 0), 0),
    [proformas]
  );

  const budgetEngage = useMemo(
    () =>
      allProformas
        .filter((proforma) => String(proforma?.statut || "").toUpperCase() === "ACCEPTEE")
        .reduce((sum, proforma) => sum + Number(proforma?.prix || 0), 0),
    [allProformas]
  );

  const proformasByStatut = useMemo(() => {
    const counter = new Map();
    allProformas.forEach((proforma) => {
      const statut = String(proforma?.statut || "SANS_STATUT");
      counter.set(statut, (counter.get(statut) || 0) + 1);
    });
    return Array.from(counter.entries()).map(([label, value]) => ({ label, value }));
  }, [allProformas]);

  const statCards = [
    { label: "Proformas en attente", value: proformas.length },
    { label: "Lots/fournisseurs", value: groupedProformas.length },
    { label: "Budget en attente", value: formatMga(pendingBudget) },
    { label: "Budget engage", value: formatMga(budgetEngage) },
    { label: "BC envoyes", value: bonCommandes.length },
  ];

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

  const getGroupStatutLabel = (group) => {
    const statuses = Array.from(new Set((group?.proformas || []).map((item) => item?.statut || "-")));
    return statuses.join(", ") || "-";
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!selectedGroup) {
      setMessage("Veuillez selectionner un lot et une entreprise.");
      return;
    }

    setSaving(true);
    try {
      await Promise.all(
        selectedGroup.proformas.map((proforma) =>
          saveBonCommande({
            proformaId: Number(proforma.id),
            statut: decision,
          })
        )
      );

      setMessage(
        `Traitement termine pour le lot ${getGroupLotLabel(selectedGroup)} et le fournisseur ${selectedGroup.fournisseur?.nom || "-"} (${selectedGroup.proformas.length} proforma(s)).`
      );
      setSelectedGroupKey("");
      await loadProformas();

      const [proformasRes, bcRes] = await Promise.allSettled([
        getAllProformas(),
        getBonCommandes(),
      ]);
      setAllProformas(
        proformasRes.status === "fulfilled" && Array.isArray(proformasRes.value.data)
          ? proformasRes.value.data
          : []
      );
      setBonCommandes(
        bcRes.status === "fulfilled" && Array.isArray(bcRes.value.data)
          ? bcRes.value.data
          : []
      );
    } catch (error) {
      setMessage(error?.response?.data || "Echec du traitement du proforma.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-card">
      <div className="page-card__header">
        <div>
          <p className="page-eyebrow">Score 80</p>
          <h2>Validation Proforma et Envoi BC</h2>
        </div>
        <p className="page-muted">Affichage: /api/proforma/list | Traitement: /api/proforma/save-bc</p>
      </div>

      {message ? <div className="alert alert-info page-alert">{message}</div> : null}

      <StatGrid items={statCards} />

      <MiniBarChart
        title="Etat des proformas"
        data={proformasByStatut}
        emptyLabel="Aucune proforma enregistree."
      />

      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead>
            <tr>
              <th>Choix</th>
              <th>Lot</th>
              <th>Fournisseur</th>
              <th>Produit / Quantite</th>
              <th>ID Proforma(s)</th>
              <th>Demande(s)</th>
              <th>Prix</th>
              <th>Prix total</th>
              <th>Delai</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" className="text-center">Chargement des proformas...</td>
              </tr>
            ) : groupedProformas.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center">Aucun proforma en attente.</td>
              </tr>
            ) : (
              groupedProformas.map((group) => {
                const checked = String(group.key) === selectedGroupKey;
                return (
                  <tr key={group.key} className={checked ? "info" : ""}>
                    <td>
                      <input
                        type="radio"
                        name="selectedProforma"
                        checked={checked}
                        onChange={() => setSelectedGroupKey(String(group.key))}
                        aria-label={`Selectionner lot ${getGroupLotLabel(group)} ${group.fournisseur?.nom || ""}`}
                      />
                    </td>
                    <td>{getGroupLotLabel(group)}</td>
                    <td>{group.fournisseur?.nom || `ID ${group.fournisseur?.id || "-"}`}</td>
                    <td>{getGroupProductsLabel(group)}</td>
                    <td>{getGroupProformaLabel(group)}</td>
                    <td>{getGroupDemandeLabel(group)}</td>
                    <td>{group.proformas.length === 1 ? group.proformas[0]?.prix ?? "-" : `${group.proformas.length} lignes`}</td>
                    <td>{formatMga(group.totalPrix)}</td>
                    <td>{group.delai ?? "-"}</td>
                    <td>{getGroupStatutLabel(group)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <form className="request-form row" onSubmit={handleSave}>
        <div className="col-sm-6">
          <div className="form-group">
            <label htmlFor="decision">Decision</label>
            <select
              id="decision"
              className="form-control"
              value={decision}
              onChange={(event) => setDecision(event.target.value)}
            >
              <option value="ACCEPTEE">ACCEPTEE (creer un BC)</option>
              <option value="REFUSEE">REFUSEE (pas de BC)</option>
            </select>
          </div>
        </div>

        <div className="col-sm-6 request-form__submit">
          <button type="submit" className="btn btn-primary btn-block" disabled={saving || !selectedGroupKey}>
            {saving ? "Traitement..." : "Enregistrer et envoyer BC"}
          </button>
        </div>
      </form>

      {selectedGroup ? (
        <div className="alert alert-warning">
          Groupe selectionne: Lot {getGroupLotLabel(selectedGroup)} - Fournisseur {selectedGroup.fournisseur?.nom || "-"} - Produits {getGroupProductsLabel(selectedGroup)} - Proforma(s) {getGroupProformaLabel(selectedGroup)} - Total {formatMga(selectedGroup.totalPrix)}
        </div>
      ) : null}
    </div>
  );
}
