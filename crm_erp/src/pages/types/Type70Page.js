import { useEffect, useMemo, useState } from "react";
import { getAllOffres } from "../../api/offreApi";
import { getDemandesAchat } from "../../api/demandeAchatApi";
import { MiniBarChart, StatGrid } from "../../components/StatsWidgets";

export default function Type70Page() {
  const [offres, setOffres] = useState([]);
  const [demandes, setDemandes] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [offresRes, demandesRes] = await Promise.allSettled([
        getAllOffres(),
        getDemandesAchat(),
      ]);

      setOffres(offresRes.status === "fulfilled" && Array.isArray(offresRes.value.data) ? offresRes.value.data : []);
      setDemandes(demandesRes.status === "fulfilled" && Array.isArray(demandesRes.value.data) ? demandesRes.value.data : []);
    };

    load();
  }, []);

  const offresByFournisseur = useMemo(() => {
    const counter = new Map();
    offres.forEach((offre) => {
      const label = offre?.fournisseur?.nom || `Fournisseur ${offre?.fournisseur?.id || "N/A"}`;
      counter.set(label, (counter.get(label) || 0) + 1);
    });
    return Array.from(counter.entries()).map(([label, value]) => ({ label, value }));
  }, [offres]);

  const demandesEnCours = demandes.filter(
    (demande) => String(demande?.statut || "").toUpperCase() === "EN_COURS"
  ).length;

  const statCards = [
    { label: "Offres a valider", value: offres.length },
    { label: "Demandes en cours", value: demandesEnCours },
    { label: "Fournisseurs impliques", value: offresByFournisseur.length },
    {
      label: "Delai moyen (jours)",
      value: offres.length
        ? Math.round(offres.reduce((sum, offre) => sum + Number(offre?.delaiLivraison || 0), 0) / offres.length)
        : 0,
    },
  ];

  return (
    <div className="page-card">
      <div className="page-card__header">
        <div>
          <p className="page-eyebrow">Score 70</p>
          <h2>Validation Offres</h2>
        </div>
        <p className="page-muted">Pilotage des offres fournisseur avant proforma.</p>
      </div>

      <StatGrid items={statCards} />

      <MiniBarChart
        title="Repartition des offres par fournisseur"
        data={offresByFournisseur}
        emptyLabel="Aucune offre a valider actuellement."
      />
    </div>
  );
}
