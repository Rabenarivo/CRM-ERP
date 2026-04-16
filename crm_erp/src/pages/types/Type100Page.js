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
  const [selectedOffreId, setSelectedOffreId] = useState("");
  const [allProformas, setAllProformas] = useState([]);
  const [form, setForm] = useState({
    prix: "",
    delai: "",
    statut: defaultStatut,
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

  const selectedOffre = useMemo(
    () => offres.find((offre) => String(offre.id) === selectedOffreId),
    [offres, selectedOffreId]
  );

  const offresByDemande = useMemo(() => {
    const counter = new Map();
    offres.forEach((offre) => {
      const label = `Demande ${offre?.demande?.id || "N/A"}`;
      counter.set(label, (counter.get(label) || 0) + 1);
    });
    return Array.from(counter.entries()).map(([label, value]) => ({ label, value }));
  }, [offres]);

  const budgetTotal = useMemo(
    () => allProformas.reduce((sum, proforma) => sum + Number(proforma?.prix || 0), 0),
    [allProformas]
  );

  const statCards = [
    { label: "Offres sans proforma", value: offres.length },
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

  useEffect(() => {
    if (!selectedOffre) {
      return;
    }

    setForm((currentForm) => ({
      ...currentForm,
      delai:
        currentForm.delai === "" && selectedOffre.delaiLivraison != null
          ? String(selectedOffre.delaiLivraison)
          : currentForm.delai,
    }));
  }, [selectedOffre]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleCreateProforma = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!selectedOffre?.demande?.id || !selectedOffre?.fournisseur?.id) {
      setMessage("Veuillez choisir une offre valide avec demande et fournisseur.");
      return;
    }

    const prix = Number(form.prix);
    const delai = Number(form.delai);

    if (Number.isNaN(prix) || prix <= 0) {
      setMessage("Le prix doit etre un nombre strictement positif.");
      return;
    }

    if (Number.isNaN(delai) || delai <= 0) {
      setMessage("Le delai doit etre un nombre strictement positif.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        idDemande: selectedOffre.demande.id,
        idFournisseur: selectedOffre.fournisseur.id,
        prix,
        delai,
        statut: form.statut || defaultStatut,
      };

      await createProforma(payload);
      setMessage("Proformat cree avec succes.");
      setForm({ prix: "", delai: "", statut: defaultStatut });
      setSelectedOffreId("");

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
        title="Offres en attente par demande"
        data={offresByDemande}
        emptyLabel="Aucune offre a transformer en proforma."
      />

      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead>
            <tr>
              <th>Choix</th>
              <th>Offre</th>
              <th>Reference</th>
              <th>Demande</th>
              <th>Fournisseur</th>
              <th>Delai livraison</th>
              <th>Statut offre</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center">
                  Chargement des offres...
                </td>
              </tr>
            ) : offres.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center">
                  Aucune offre disponible.
                </td>
              </tr>
            ) : (
              offres.map((offre) => {
                const checked = String(offre.id) === selectedOffreId;

                return (
                  <tr key={offre.id} className={checked ? "info" : ""}>
                    <td>
                      <input
                        type="radio"
                        name="selectedOffre"
                        checked={checked}
                        onChange={() => setSelectedOffreId(String(offre.id))}
                        aria-label={`Selectionner offre ${offre.id}`}
                      />
                    </td>
                    <td>{offre.id}</td>
                    <td>{offre.reference || "-"}</td>
                    <td>{offre.demande?.id || "-"}</td>
                    <td>{offre.fournisseur?.nom || `ID ${offre.fournisseur?.id || "-"}`}</td>
                    <td>{offre.delaiLivraison ?? "-"}</td>
                    <td>{offre.statut || "-"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <form className="request-form row" onSubmit={handleCreateProforma}>
        <div className="col-sm-3">
          <div className="form-group">
            <label htmlFor="prix">Prix</label>
            <input
              id="prix"
              name="prix"
              type="number"
              className="form-control"
              min="0"
              step="0.01"
              placeholder="Ex: 250000"
              value={form.prix}
              onChange={handleFormChange}
              required
            />
          </div>
        </div>

        <div className="col-sm-3">
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

        <div className="col-sm-4">
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
          <button type="submit" className="btn btn-primary btn-block" disabled={saving || !selectedOffreId}>
            {saving ? "Creation..." : "Creer"}
          </button>
        </div>
      </form>
    </div>
  );
}
