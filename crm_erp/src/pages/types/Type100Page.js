import { useEffect, useMemo, useState } from "react";
import { getAllOffres } from "../../api/offreApi";
import { createProforma, getAllProformas } from "../../api/proformaApi";
import { MiniBarChart, StatGrid, formatMga } from "../../components/StatsWidgets";

const defaultStatut = "EN_ATTENTE_VALIDATION";

export default function Type100Page() {
  const [offres, setOffres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedGroupKey, setSelectedGroupKey] = useState("");
  const [allProformas, setAllProformas] = useState([]);
  const [form, setForm] = useState({
    delai: "",
    statut: defaultStatut,
    linePrices: {},
  });

  useEffect(() => {
    const loadOffres = async () => {
      try {
        const response = await getAllOffres();
        setOffres(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        setMessage("Impossible de charger la liste des offres.");
      } finally {
        setLoading(false);
      }
    };

    loadOffres();
  }, []);

  useEffect(() => {
    const loadProformas = async () => {
      try {
        const response = await getAllProformas();
        setAllProformas(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        setAllProformas([]);
      }
    };

    loadProformas();
  }, []);

  const groupedOffres = useMemo(() => {
    const groups = new Map();

    offres.forEach((offre) => {
      const batchReference = offre?.demande?.batchReference || null;
      const fournisseurId = offre?.fournisseur?.id || "N/A";
      const key = batchReference
        ? `batch-${batchReference}-f-${fournisseurId}`
        : `offre-${offre.id}`;

      const existing = groups.get(key);
      if (existing) {
        existing.offres.push(offre);
        existing.totalQuantite += Number(offre?.demande?.quantite || 0);
        existing.produits.push({
          produit: offre?.demande?.produit || "-",
          quantite: Number(offre?.demande?.quantite || 0),
        });
      } else {
        groups.set(key, {
          key,
          batchReference,
          fournisseur: offre?.fournisseur || null,
          offres: [offre],
          reference: offre?.reference || "-",
          totalQuantite: Number(offre?.demande?.quantite || 0),
          delaiLivraison: offre?.delaiLivraison,
          statut: offre?.statut,
          produits: [
            {
              produit: offre?.demande?.produit || "-",
              quantite: Number(offre?.demande?.quantite || 0),
            },
          ],
        });
      }
    });

    return Array.from(groups.values());
  }, [offres]);

  const selectedGroup = useMemo(
    () => groupedOffres.find((group) => String(group.key) === selectedGroupKey),
    [groupedOffres, selectedGroupKey]
  );

  const offresByDemande = useMemo(() => {
    const counter = new Map();
    groupedOffres.forEach((group) => {
      const label = group?.batchReference
        ? `Lot ${group.batchReference}`
        : `Demande ${group?.offres?.[0]?.demande?.id || "N/A"}`;
      counter.set(label, (counter.get(label) || 0) + 1);
    });
    return Array.from(counter.entries()).map(([label, value]) => ({ label, value }));
  }, [groupedOffres]);

  const budgetTotal = useMemo(
    () => allProformas.reduce((sum, proforma) => sum + Number(proforma?.prix || 0), 0),
    [allProformas]
  );

  const statCards = [
    { label: "Offres sans proforma", value: offres.length },
    { label: "Lots d'offres", value: groupedOffres.length },
    {
      label: "Demandes concernees",
      value: new Set(offres.map((offre) => String(offre?.demande?.id || ""))).size,
    },
    {
      label: "Fournisseurs concernes",
      value: new Set(offres.map((offre) => String(offre?.fournisseur?.id || ""))).size,
    },
    { label: "Budget proformas cumule", value: formatMga(budgetTotal) },
  ];

  const totalPrixSaisi = useMemo(() => {
    if (!selectedGroup?.offres?.length) {
      return 0;
    }

    return selectedGroup.offres.reduce(
      (sum, offre) => sum + Number(form.linePrices?.[String(offre.id)] || 0),
      0
    );
  }, [selectedGroup, form.linePrices]);

  useEffect(() => {
    if (!selectedGroup) {
      return;
    }

    setForm((currentForm) => ({
      linePrices: selectedGroup.offres.reduce((acc, offre) => {
        const key = String(offre.id);
        acc[key] = currentForm.linePrices?.[key] ?? "";
        return acc;
      }, {}),
      ...currentForm,
      delai:
        currentForm.delai === "" && selectedGroup.delaiLivraison != null
          ? String(selectedGroup.delaiLivraison)
          : currentForm.delai,
    }));
  }, [selectedGroup]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleLinePriceChange = (offreId, value) => {
    const key = String(offreId);
    setForm((currentForm) => ({
      ...currentForm,
      linePrices: {
        ...(currentForm.linePrices || {}),
        [key]: value,
      },
    }));
  };

  const handleCreateProforma = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!selectedGroup?.offres?.length || !selectedGroup?.fournisseur?.id) {
      setMessage("Veuillez choisir un lot d'offres valide avec fournisseur.");
      return;
    }

    const delai = Number(form.delai);

    if (Number.isNaN(delai) || delai <= 0) {
      setMessage("Le delai doit etre un nombre strictement positif.");
      return;
    }

    const lineEntries = selectedGroup.offres.map((offre) => {
      const prixLigne = Number(form.linePrices?.[String(offre.id)]);
      return {
        offre,
        prixLigne,
      };
    });

    const invalidLine = lineEntries.find(
      (entry) => Number.isNaN(entry.prixLigne) || entry.prixLigne <= 0
    );

    if (invalidLine) {
      setMessage("Chaque produit du lot doit avoir un prix strictement positif.");
      return;
    }

    setSaving(true);

    try {
      await Promise.all(
        lineEntries.map(({ offre, prixLigne }) => {
          const payload = {
            idDemande: offre.demande.id,
            idFournisseur: selectedGroup.fournisseur.id,
            prix: prixLigne,
            delai,
            statut: form.statut || defaultStatut,
          };

          return createProforma(payload);
        })
      );

      setMessage(
        `Proformat(s) cree(s) avec succes pour ${selectedGroup.offres.length} ligne(s)${selectedGroup.batchReference ? ` du lot ${selectedGroup.batchReference}` : ""}.`
      );
      setForm({ delai: "", statut: defaultStatut, linePrices: {} });
      setSelectedGroupKey("");

      const [offresResponse, proformasResponse] = await Promise.allSettled([
        getAllOffres(),
        getAllProformas(),
      ]);
      setOffres(
        offresResponse.status === "fulfilled" && Array.isArray(offresResponse.value.data)
          ? offresResponse.value.data
          : []
      );
      setAllProformas(
        proformasResponse.status === "fulfilled" && Array.isArray(proformasResponse.value.data)
          ? proformasResponse.value.data
          : []
      );
    } catch (error) {
      setMessage(error?.response?.data || "Echec de creation du proformat.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-card">
      <div className="page-card__header">
        <div>
          <p className="page-eyebrow">Score 100</p>
          <h2>Creation Proformat (Admin)</h2>
        </div>
        <p className="page-muted">Source: GET /api/offres/get-offre | Save: POST /api/proforma/save-proforma</p>
      </div>

      {message ? <div className="alert alert-info page-alert">{message}</div> : null}

      <StatGrid items={statCards} />

      <MiniBarChart
        title="Offres en attente par lot"
        data={offresByDemande}
        emptyLabel="Aucune offre a transformer en proforma."
      />

      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead>
            <tr>
              <th>Choix</th>
              <th>Lot</th>
              <th>Reference</th>
              <th>Produits</th>
              <th>Quantite totale</th>
              <th>Fournisseur</th>
              <th>Delai livraison</th>
              <th>Statut offre</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center">
                  Chargement des offres...
                </td>
              </tr>
            ) : offres.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center">
                  Aucune offre disponible.
                </td>
              </tr>
            ) : (
              groupedOffres.map((group) => {
                const checked = String(group.key) === selectedGroupKey;
                const produitsLabel = group.produits
                  .map((item) => `${item.produit} (${item.quantite})`)
                  .join(", ");

                return (
                  <tr key={group.key} className={checked ? "info" : ""}>
                    <td>
                      <input
                        type="radio"
                        name="selectedOffreGroup"
                        checked={checked}
                        onChange={() => setSelectedGroupKey(String(group.key))}
                        aria-label={`Selectionner lot ${group.batchReference || group.key}`}
                      />
                    </td>
                    <td>{group.batchReference || `Offre ${group.offres[0]?.id || "-"}`}</td>
                    <td>{group.reference || "-"}</td>
                    <td>{produitsLabel}</td>
                    <td>{group.totalQuantite}</td>
                    <td>{group.fournisseur?.nom || `ID ${group.fournisseur?.id || "-"}`}</td>
                    <td>{group.delaiLivraison ?? "-"}</td>
                    <td>{group.statut || "-"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <form className="request-form row" onSubmit={handleCreateProforma}>
        <div className="col-12">
          <div className="form-group">
            <label>Prix par produit du lot</label>
            {selectedGroup?.offres?.length ? (
              <div className="table-responsive">
                <table className="table table-sm table-bordered mb-2">
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>Quantite</th>
                      <th>Prix</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedGroup.offres.map((offre) => {
                      const id = String(offre.id);
                      return (
                        <tr key={id}>
                          <td>{offre?.demande?.produit || "-"}</td>
                          <td>{offre?.demande?.quantite ?? "-"}</td>
                          <td style={{ minWidth: 180 }}>
                            <input
                              type="number"
                              className="form-control"
                              min="0"
                              step="0.01"
                              placeholder="Ex: 250000"
                              value={form.linePrices?.[id] ?? ""}
                              onChange={(event) => handleLinePriceChange(id, event.target.value)}
                              required
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-muted">Selectionnez un lot pour saisir les prix par produit.</div>
            )}
            <small className="text-muted">Total saisi: {formatMga(totalPrixSaisi)}</small>
          </div>
        </div>

        <div className="col-sm-4">
          <div className="form-group">
            <label htmlFor="delai">Delai (jours)</label>
            <input
              id="delai"
              name="delai"
              type="number"
              className="form-control"
              min="1"
              step="1"
              placeholder="Ex: 15"
              value={form.delai}
              onChange={handleFormChange}
              required
            />
          </div>
        </div>

        <div className="col-sm-6">
          <div className="form-group">
            <label htmlFor="statut">Statut</label>
            <input
              id="statut"
              name="statut"
              type="text"
              className="form-control"
              value={form.statut}
              onChange={handleFormChange}
              placeholder="EN_ATTENTE_VALIDATION"
            />
          </div>
        </div>

        <div className="col-sm-2 request-form__submit">
          <button type="submit" className="btn btn-primary btn-block" disabled={saving || !selectedGroupKey}>
            {saving ? "Creation..." : "Creer"}
          </button>
        </div>
      </form>
    </div>
  );
}
