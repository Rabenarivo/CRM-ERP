import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { createDemandeAchat, getDemandesAchat } from "../../api/demandeAchatApi";
import { MiniBarChart, StatGrid } from "../../components/StatsWidgets";

const createLine = () => ({
  produit: "",
  quantite: "",
});

export default function DemandeAchatPage() {
  const { user } = useContext(AuthContext);
  const [lines, setLines] = useState([createLine()]);
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const demandeByStatut = useMemo(() => {
    const counter = new Map();
    demandes.forEach((demande) => {
      const statut = String(demande?.statut || "SANS_STATUT");
      counter.set(statut, (counter.get(statut) || 0) + 1);
    });
    return Array.from(counter.entries()).map(([label, value]) => ({ label, value }));
  }, [demandes]);

  const totalQuantite = useMemo(
    () => demandes.reduce((sum, demande) => sum + Number(demande?.quantite || 0), 0),
    [demandes]
  );

  const statCards = [
    { label: "Total demandes", value: demandes.length },
    { label: "Quantite totale", value: totalQuantite },
    {
      label: "Demandes en cours",
      value: demandes.filter((demande) => String(demande?.statut || "").toUpperCase() === "EN_COURS").length,
    },
    {
      label: "Demandes envoyees",
      value: demandes.filter((demande) => String(demande?.statut || "").toUpperCase() === "ENVOYE").length,
    },
  ];

  useEffect(() => {
    const loadDemandes = async () => {
      try {
        const response = await getDemandesAchat();
        setDemandes(response.data);
      } catch (error) {
        setMessage("Impossible de charger les demandes d'achat.");
      } finally {
        setLoading(false);
      }
    };

    loadDemandes();
  }, []);

  const handleChangeLine = (index, field, value) => {
    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [field]: value } : line
      )
    );
  };

  const handleAddLine = () => {
    setLines((current) => [...current, createLine()]);
  };

  const handleRemoveLine = (index) => {
    setLines((current) => {
      if (current.length === 1) {
        return current;
      }
      return current.filter((_, lineIndex) => lineIndex !== index);
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!user?.id) {
      setMessage("Utilisateur introuvable. Reconnectez-vous.");
      return;
    }

    setSaving(true);

    try {
      const validLines = lines
        .map((line) => ({
          produit: String(line.produit || "").trim(),
          quantite: Number(line.quantite),
        }))
        .filter((line) => line.produit && Number.isFinite(line.quantite) && line.quantite > 0);

      if (validLines.length === 0) {
        setMessage("Ajoutez au moins un produit valide avec une quantite > 0.");
        setSaving(false);
        return;
      }

      const payload = {
        items: validLines,
        userId: user.id,
      };

      const response = await createDemandeAchat(payload);
      const createdDemandes = Array.isArray(response?.data?.demandes)
        ? response.data.demandes
        : response?.data?.id
          ? [response.data]
          : [];

      if (createdDemandes.length > 0) {
        setDemandes((currentDemandes) => [...createdDemandes, ...currentDemandes]);
      }

      setLines([createLine()]);

      if (Array.isArray(response?.data?.demandes)) {
        setMessage(
          `Demande d'achat creee avec ${response.data.demandes.length} produit(s) (Ref: ${response?.data?.batchReference || "N/A"}).`
        );
      } else {
        setMessage("Demande d'achat créée avec succès.");
      }
    } catch (error) {
      setMessage(
        error?.response?.data?.message || error?.response?.data || "La création de la demande d'achat a échoué."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-card">
      <div className="page-card__header">
        <div>
          <p className="page-eyebrow">Score 50</p>
          <h2>Demandes d'achat</h2>
        </div>
        <p className="page-muted">Création et suivi via l'API /api/demandes-achat</p>
      </div>

      {message ? <div className="alert alert-info page-alert">{message}</div> : null}

      <StatGrid items={statCards} />

      <MiniBarChart
        title="Statistiques des demandes"
        data={demandeByStatut}
        emptyLabel="Aucune demande a analyser."
      />

      <form className="request-form" onSubmit={handleSubmit}>
        {lines.map((line, index) => (
          <div className="row" key={`line-${index}`} style={{ marginBottom: 10 }}>
            <div className="col-sm-6">
              <div className="form-group">
                <label htmlFor={`produit-${index}`}>Produit</label>
                <input
                  id={`produit-${index}`}
                  type="text"
                  className="form-control"
                  value={line.produit}
                  onChange={(event) => handleChangeLine(index, "produit", event.target.value)}
                  placeholder="Nom du produit"
                  required
                />
              </div>
            </div>

            <div className="col-sm-3">
              <div className="form-group">
                <label htmlFor={`quantite-${index}`}>Quantite</label>
                <input
                  id={`quantite-${index}`}
                  type="number"
                  className="form-control"
                  value={line.quantite}
                  onChange={(event) => handleChangeLine(index, "quantite", event.target.value)}
                  min="1"
                  step="1"
                  placeholder="1"
                  required
                />
              </div>
            </div>

            <div className="col-sm-3" style={{ paddingTop: 25 }}>
              <button
                type="button"
                className="btn btn-default"
                onClick={() => handleRemoveLine(index)}
                disabled={lines.length === 1 || saving}
              >
                Supprimer ligne
              </button>
            </div>
          </div>
        ))}

        <div className="row" style={{ marginBottom: 12 }}>
          <div className="col-sm-6">
            <button type="button" className="btn btn-default" onClick={handleAddLine} disabled={saving}>
              + Ajouter un produit
            </button>
          </div>
        </div>

        <div className="request-form__submit">
          <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
            {saving ? "Creation en cours..." : "Creer la demande multi-produits"}
          </button>
        </div>
      </form>

      <section className="request-list">
        <div className="request-list__header">
          <h3>Historique</h3>
          <span>{demandes.length} demande(s)</span>
        </div>

        {loading ? (
          <p className="page-muted">Chargement des demandes...</p>
        ) : demandes.length === 0 ? (
          <p className="page-muted">Aucune demande d'achat trouvée.</p>
        ) : (
          <div className="request-list__items">
            {demandes.map((demande) => (
              <article key={demande.id} className="request-item panel panel-default">
                <div className="panel-body">
                  <strong>{demande.produit}</strong>
                  <p>Quantité: {demande.quantite}</p>
                  <p>Statut: {demande.statut || "-"}</p>
                  <p>Lot: {demande.batchReference || "-"}</p>
                  <p>
                    Demandeur: {demande.user?.nom || "-"} · Département: {demande.department?.nom || "-"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}