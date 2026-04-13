import { useEffect, useMemo, useState } from "react";
import { getProformaList, saveBonCommande } from "../../api/proformaApi";

export default function Type80Page() {
  const [proformas, setProformas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedProformaId, setSelectedProformaId] = useState("");
  const [decision, setDecision] = useState("ACCEPTEE");
  const [message, setMessage] = useState("");

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

  const selectedProforma = useMemo(
    () => proformas.find((proforma) => String(proforma.id) === selectedProformaId),
    [proformas, selectedProformaId]
  );

  const handleSave = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!selectedProformaId) {
      setMessage("Veuillez selectionner un proforma.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        proformaId: Number(selectedProformaId),
        statut: decision,
      };

      const response = await saveBonCommande(payload);
      setMessage(response?.data?.message || "Traitement termine.");
      setSelectedProformaId("");
      await loadProformas();
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

      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead>
            <tr>
              <th>Choix</th>
              <th>ID Proforma</th>
              <th>Demande</th>
              <th>Fournisseur</th>
              <th>Prix</th>
              <th>Delai</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center">Chargement des proformas...</td>
              </tr>
            ) : proformas.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center">Aucun proforma en attente.</td>
              </tr>
            ) : (
              proformas.map((proforma) => {
                const checked = String(proforma.id) === selectedProformaId;
                return (
                  <tr key={proforma.id} className={checked ? "info" : ""}>
                    <td>
                      <input
                        type="radio"
                        name="selectedProforma"
                        checked={checked}
                        onChange={() => setSelectedProformaId(String(proforma.id))}
                        aria-label={`Selectionner proforma ${proforma.id}`}
                      />
                    </td>
                    <td>{proforma.id}</td>
                    <td>{proforma.demande?.id || "-"}</td>
                    <td>{proforma.fournisseur?.nom || `ID ${proforma.fournisseur?.id || "-"}`}</td>
                    <td>{proforma.prix ?? "-"}</td>
                    <td>{proforma.delai ?? "-"}</td>
                    <td>{proforma.statut || "-"}</td>
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
          <button type="submit" className="btn btn-primary btn-block" disabled={saving || !selectedProformaId}>
            {saving ? "Traitement..." : "Enregistrer et envoyer BC"}
          </button>
        </div>
      </form>

      {selectedProforma ? (
        <div className="alert alert-warning">
          Proforma selectionne: #{selectedProforma.id} - Fournisseur {selectedProforma.fournisseur?.nom || "-"} - Prix {selectedProforma.prix ?? "-"}
        </div>
      ) : null}
    </div>
  );
}
