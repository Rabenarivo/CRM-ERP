import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { getUserDepartmentScore } from "../../config/departmentScores";
import { getDemandesAchat } from "../../api/demandeAchatApi";
import { getAllOffres } from "../../api/offreApi";
import { getAllProformas } from "../../api/proformaApi";
import { getBonCommandes } from "../../api/bonCommandeApi";
import { MiniBarChart, StatGrid, formatMga } from "../../components/StatsWidgets";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const userScore = getUserDepartmentScore(user);
  const [demandes, setDemandes] = useState([]);
  const [offres, setOffres] = useState([]);
  const [proformas, setProformas] = useState([]);
  const [bonCommandes, setBonCommandes] = useState([]);

  useEffect(() => {
    const loadStats = async () => {
      const [demandesRes, offresRes, proformasRes, bcRes] = await Promise.allSettled([
        getDemandesAchat(),
        getAllOffres(),
        getAllProformas(),
        getBonCommandes(),
      ]);

      setDemandes(demandesRes.status === "fulfilled" && Array.isArray(demandesRes.value.data) ? demandesRes.value.data : []);
      setOffres(offresRes.status === "fulfilled" && Array.isArray(offresRes.value.data) ? offresRes.value.data : []);
      setProformas(proformasRes.status === "fulfilled" && Array.isArray(proformasRes.value.data) ? proformasRes.value.data : []);
      setBonCommandes(bcRes.status === "fulfilled" && Array.isArray(bcRes.value.data) ? bcRes.value.data : []);
    };

    loadStats();
  }, []);

  const demandeByStatut = useMemo(() => {
    const counter = new Map();
    demandes.forEach((demande) => {
      const statut = String(demande?.statut || "SANS_STATUT");
      counter.set(statut, (counter.get(statut) || 0) + 1);
    });
    return Array.from(counter.entries()).map(([label, value]) => ({ label, value }));
  }, [demandes]);

  const montantProforma = useMemo(
    () => proformas.reduce((sum, proforma) => sum + Number(proforma?.prix || 0), 0),
    [proformas]
  );

  const montantBudgetEngage = useMemo(
    () =>
      proformas
        .filter((proforma) => String(proforma?.statut || "").toUpperCase() === "ACCEPTEE")
        .reduce((sum, proforma) => sum + Number(proforma?.prix || 0), 0),
    [proformas]
  );

  const quantiteTotaleDemandee = useMemo(
    () => demandes.reduce((sum, demande) => sum + Number(demande?.quantite || 0), 0),
    [demandes]
  );

  const statItems = [
    { label: "Demandes achat", value: demandes.length },
    { label: "Offres a traiter", value: offres.length },
    { label: "Proformas total", value: proformas.length },
    { label: "BC envoyes", value: bonCommandes.length },
    { label: "Quantite demandee", value: quantiteTotaleDemandee },
    { label: "Budget proformas", value: formatMga(montantProforma) },
    { label: "Budget engage", value: formatMga(montantBudgetEngage) },
  ];

  return (
    <div className="page-card">
      <div className="page-card__header">
        <div>
          <p className="page-eyebrow">Accueil</p>
          <h2>Dashboard</h2>
        </div>
        <p className="page-muted">Vue d'ensemble de votre acces metier.</p>
      </div>

      <StatGrid items={statItems} />

      <MiniBarChart
        title="Repartition des demandes par statut"
        data={demandeByStatut}
        emptyLabel="Aucune demande d'achat enregistree."
      />

      <div className="row">
        <div className="col-sm-4">
          <div className="panel panel-default">
            <div className="panel-heading">Utilisateur</div>
            <div className="panel-body">
              <strong>{user?.nom || "Unknown"}</strong>
            </div>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="panel panel-default">
            <div className="panel-heading">Departement</div>
            <div className="panel-body">
              <strong>{user?.department?.nom || "Unknown"}</strong>
            </div>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="panel panel-default">
            <div className="panel-heading">Score</div>
            <div className="panel-body">
              <strong>{userScore}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
