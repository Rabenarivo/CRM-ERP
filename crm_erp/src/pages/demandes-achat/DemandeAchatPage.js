import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { createDemandeAchat, getDemandesAchat } from "../../api/demandeAchatApi";

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

      {message ? <div className="page-alert">{message}</div> : null}

      <form className="request-form" onSubmit={handleSubmit}>
        <label>
          Produit
          <input
            type="text"
            name="produit"
            value={form.produit}
            onChange={handleChange}
            placeholder="Nom du produit"
            required
          />
        </label>

        <label>
          Quantité
          <input
            type="number"
            name="quantite"
            value={form.quantite}
            onChange={handleChange}
            min="1"
            step="1"
            placeholder="1"
            required
          />
        </label>

        <button type="submit" disabled={saving}>
          {saving ? "Création en cours..." : "Créer la demande"}
        </button>
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
              <article key={demande.id} className="request-item">
                <strong>{demande.produit}</strong>
                <p>Quantité: {demande.quantite}</p>
                <p>Statut: {demande.statut || "-"}</p>
                <p>
                  Demandeur: {demande.user?.nom || "-"} · Département: {demande.department?.nom || "-"}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}