import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { createDemandeAchat, getDemandesAchat } from "../../api/demandeAchatApi";
import { MiniBarChart, StatGrid } from "../../components/StatsWidgets";

const initialForm = {
  produit: "",
  quantite: "",
};

export default function DemandeAchatPage() {
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState(initialForm);
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
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
      const payload = {
        produit: form.produit,
        quantite: Number(form.quantite),
        userId: user.id,
      };

      const response = await createDemandeAchat(payload);
      setDemandes((currentDemandes) => [response.data, ...currentDemandes]);
      setForm(initialForm);
      setMessage("Demande d'achat créée avec succès.");
    } catch (error) {
      setMessage(
        error?.response?.data || "La création de la demande d'achat a échoué."
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

      <form className="request-form row" onSubmit={handleSubmit}>
        <div className="col-sm-5">
          <div className="form-group">
            <label htmlFor="produit">Produit</label>
            <input
              id="produit"
              type="text"
              className="form-control"
              name="produit"
              value={form.produit}
              onChange={handleChange}
              placeholder="Nom du produit"
              required
            />
          </div>
        </div>

        <div className="col-sm-4">
          <div className="form-group">
            <label htmlFor="quantite">Quantite</label>
            <input
              id="quantite"
              type="number"
              className="form-control"
              name="quantite"
              value={form.quantite}
              onChange={handleChange}
              min="1"
              step="1"
              placeholder="1"
              required
            />
          </div>
        </div>

        <div className="col-sm-3 request-form__submit">
          <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
            {saving ? "Creation en cours..." : "Creer la demande"}
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