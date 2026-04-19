import { useEffect, useMemo, useState } from "react";
import { MiniBarChart, StatGrid, formatMga } from "../../components/StatsWidgets";
import { getWorkflowLogs } from "../../api/workflowLogApi";
import { getUsers, createUser, updateUser, deleteUser } from "../../api/userAdminApi";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../../api/departmentApi";
import { getRoles } from "../../api/roleApi";
import { getAllFactures } from "../../api/factureApi";

const emptyUserForm = {
  nom: "",
  email: "",
  password: "",
  departmentId: "",
  roleId: "",
  enabled: true,
};

const emptyDepartmentForm = {
  nom: "",
  scores: "",
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

export default function Type120Page() {
  const [workflowLogs, setWorkflowLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [workflowFilters, setWorkflowFilters] = useState({
    search: "",
    action: "",
    userId: "",
    departmentId: "",
    dateFrom: "",
    dateTo: "",
  });
  const [factureFilters, setFactureFilters] = useState({
    search: "",
    statut: "",
  });
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [editingUserId, setEditingUserId] = useState(null);
  const [savingUser, setSavingUser] = useState(false);
  const [departmentForm, setDepartmentForm] = useState(emptyDepartmentForm);
  const [editingDepartmentId, setEditingDepartmentId] = useState(null);
  const [savingDepartment, setSavingDepartment] = useState(false);

  const refreshData = async () => {
    setLoading(true);
    setError("");

    try {
      const [logsRes, usersRes, departmentsRes, rolesRes, facturesRes] = await Promise.allSettled([
        getWorkflowLogs(),
        getUsers(),
        getDepartments(),
        getRoles(),
        getAllFactures(),
      ]);

      setWorkflowLogs(
        logsRes.status === "fulfilled" && Array.isArray(logsRes.value.data)
          ? logsRes.value.data
          : []
      );
      setUsers(
        usersRes.status === "fulfilled" && Array.isArray(usersRes.value.data)
          ? usersRes.value.data
          : []
      );
      setDepartments(
        departmentsRes.status === "fulfilled" && Array.isArray(departmentsRes.value.data)
          ? departmentsRes.value.data
          : []
      );
      setRoles(
        rolesRes.status === "fulfilled" && Array.isArray(rolesRes.value.data)
          ? rolesRes.value.data
          : []
      );
      setFactures(
        facturesRes.status === "fulfilled" && Array.isArray(facturesRes.value.data)
          ? facturesRes.value.data
          : []
      );
    } catch (loadError) {
      setError("Impossible de charger les donnees admin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const workflowByAction = useMemo(() => {
    const counter = new Map();
    workflowLogs.forEach((log) => {
      const label = String(log?.action || "SANS_ACTION");
      counter.set(label, (counter.get(label) || 0) + 1);
    });
    return Array.from(counter.entries()).map(([label, value]) => ({ label, value }));
  }, [workflowLogs]);

  const facturesByStatut = useMemo(() => {
    const counter = new Map();
    factures.forEach((facture) => {
      const label = String(facture?.statut || "SANS_STATUT");
      counter.set(label, (counter.get(label) || 0) + 1);
    });
    return Array.from(counter.entries()).map(([label, value]) => ({ label, value }));
  }, [factures]);

  const montantFactures = useMemo(
    () => factures.reduce((sum, facture) => sum + Number(facture?.montantTtc || 0), 0),
    [factures]
  );

  const stats = [
    { label: "Users", value: users.length },
    { label: "Departements", value: departments.length },
    { label: "Factures", value: factures.length },
    { label: "Workflow logs", value: workflowLogs.length },
    { label: "Montant factures", value: formatMga(montantFactures) },
  ];

  const filteredWorkflowLogs = useMemo(() => {
    const search = normalize(workflowFilters.search);
    const action = normalize(workflowFilters.action);
    const userId = normalize(workflowFilters.userId);
    const departmentId = normalize(workflowFilters.departmentId);
    const dateFrom = workflowFilters.dateFrom ? new Date(workflowFilters.dateFrom) : null;
    const dateTo = workflowFilters.dateTo ? new Date(`${workflowFilters.dateTo}T23:59:59`) : null;

    return workflowLogs.filter((log) => {
      const logDate = log?.dateAction ? new Date(log.dateAction) : null;
      const matchesSearch =
        !search ||
        [log?.action, log?.commentaire, log?.user?.nom, log?.department?.nom]
          .filter(Boolean)
          .some((value) => normalize(value).includes(search));

      const matchesAction = !action || normalize(log?.action) === action;
      const matchesUser = !userId || String(log?.user?.id || "") === userId;
      const matchesDepartment =
        !departmentId || String(log?.department?.id || "") === departmentId;
      const matchesDateFrom = !dateFrom || !logDate || logDate >= dateFrom;
      const matchesDateTo = !dateTo || !logDate || logDate <= dateTo;

      return (
        matchesSearch &&
        matchesAction &&
        matchesUser &&
        matchesDepartment &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  }, [workflowFilters, workflowLogs]);

  const filteredFactures = useMemo(() => {
    const search = normalize(factureFilters.search);
    const statut = normalize(factureFilters.statut);

    return factures.filter((facture) => {
      const matchesSearch =
        !search ||
        [
          facture?.reference,
          facture?.client?.nom,
          facture?.livraison?.reference,
          facture?.statut,
        ]
          .filter(Boolean)
          .some((value) => normalize(value).includes(search));
      const matchesStatut = !statut || normalize(facture?.statut) === statut;
      return matchesSearch && matchesStatut;
    });
  }, [factureFilters, factures]);

  const handleUserFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setUserForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDepartmentFormChange = (event) => {
    const { name, value } = event.target;
    setDepartmentForm((current) => ({ ...current, [name]: value }));
  };

  const handleWorkflowFilterChange = (event) => {
    const { name, value } = event.target;
    setWorkflowFilters((current) => ({ ...current, [name]: value }));
  };

  const handleFactureFilterChange = (event) => {
    const { name, value } = event.target;
    setFactureFilters((current) => ({ ...current, [name]: value }));
  };

  const resetUserForm = () => {
    setUserForm(emptyUserForm);
    setEditingUserId(null);
  };

  const resetDepartmentForm = () => {
    setDepartmentForm(emptyDepartmentForm);
    setEditingDepartmentId(null);
  };

  const handleEditUser = (user) => {
    setEditingUserId(user.id);
    setUserForm({
      nom: user?.nom || "",
      email: user?.email || "",
      password: "",
      departmentId: user?.department?.id ? String(user.department.id) : "",
      roleId: user?.roles?.[0]?.id ? String(user.roles[0].id) : "",
      enabled: Boolean(user?.enabled),
    });
  };

  const handleEditDepartment = (department) => {
    setEditingDepartmentId(department.id);
    setDepartmentForm({
      nom: department?.nom || "",
      scores: department?.scores != null ? String(department.scores) : "",
    });
  };

  const submitUser = async (event) => {
    event.preventDefault();
    setMessage("");
    setSavingUser(true);

    try {
      const payload = {
        nom: userForm.nom,
        email: userForm.email,
        password: userForm.password,
        enabled: userForm.enabled,
        departmentId: userForm.departmentId ? Number(userForm.departmentId) : null,
        roleId: userForm.roleId ? Number(userForm.roleId) : null,
      };

      if (editingUserId) {
        await updateUser(editingUserId, payload);
        setMessage("Utilisateur mis a jour.");
      } else {
        await createUser(payload);
        setMessage("Utilisateur cree.");
      }

      resetUserForm();
      await refreshData();
    } catch (saveError) {
      setError(saveError?.response?.data?.message || "Impossible d'enregistrer l'utilisateur.");
    } finally {
      setSavingUser(false);
    }
  };

  const submitDepartment = async (event) => {
    event.preventDefault();
    setMessage("");
    setSavingDepartment(true);

    try {
      const payload = {
        nom: departmentForm.nom,
        scores: Number(departmentForm.scores),
      };

      if (editingDepartmentId) {
        await updateDepartment(editingDepartmentId, payload);
        setMessage("Departement mis a jour.");
      } else {
        await createDepartment(payload);
        setMessage("Departement cree.");
      }

      resetDepartmentForm();
      await refreshData();
    } catch (saveError) {
      setError(saveError?.response?.data?.message || "Impossible d'enregistrer le departement.");
    } finally {
      setSavingDepartment(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Supprimer cet utilisateur ?")) return;

    try {
      await deleteUser(id);
      await refreshData();
      setMessage("Utilisateur supprime.");
    } catch (deleteError) {
      setError(deleteError?.response?.data?.message || "Impossible de supprimer l'utilisateur.");
    }
  };

  const handleDeleteDepartment = async (id) => {
    if (!window.confirm("Supprimer ce departement ?")) return;

    try {
      await deleteDepartment(id);
      await refreshData();
      setMessage("Departement supprime.");
    } catch (deleteError) {
      setError(deleteError?.response?.data?.message || "Impossible de supprimer le departement.");
    }
  };

  return (
    <div className="page-card">
      <div className="page-card__header">
        <div>
          <p className="page-eyebrow">Score 120</p>
          <h2>Administration complete</h2>
        </div>
        <p className="page-muted">Workflow logs, users, departements, factures et pilotage.</p>
      </div>

      {error ? <div className="alert alert-warning page-alert">{error}</div> : null}
      {message ? <div className="alert alert-success page-alert">{message}</div> : null}

      <StatGrid items={stats} />

      <div className="workflow-grid">
        <MiniBarChart
          title="Workflow par action"
          data={workflowByAction}
          emptyLabel="Aucun workflow log disponible."
        />

        <MiniBarChart
          title="Factures par statut"
          data={facturesByStatut}
          emptyLabel="Aucune facture disponible."
        />
      </div>

      <section className="workflow-card" style={{ marginBottom: 18 }}>
        <div className="request-list__header">
          <div>
            <h3>Workflow log complet</h3>
            <p className="page-muted">Recherche, filtre par action, utilisateur, departement et dates.</p>
          </div>
        </div>

        <div className="row" style={{ marginBottom: 12 }}>
          <div className="col-md-4">
            <label className="form-label">Recherche</label>
            <input
              className="form-control"
              name="search"
              value={workflowFilters.search}
              onChange={handleWorkflowFilterChange}
              placeholder="Action, commentaire, user..."
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Action</label>
            <select
              className="form-control"
              name="action"
              value={workflowFilters.action}
              onChange={handleWorkflowFilterChange}
            >
              <option value="">Toutes</option>
              {workflowByAction.map((item) => (
                <option key={item.label} value={item.label}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Utilisateur</label>
            <select
              className="form-control"
              name="userId"
              value={workflowFilters.userId}
              onChange={handleWorkflowFilterChange}
            >
              <option value="">Tous</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Departement</label>
            <select
              className="form-control"
              name="departmentId"
              value={workflowFilters.departmentId}
              onChange={handleWorkflowFilterChange}
            >
              <option value="">Tous</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-1">
            <label className="form-label">Du</label>
            <input
              type="date"
              className="form-control"
              name="dateFrom"
              value={workflowFilters.dateFrom}
              onChange={handleWorkflowFilterChange}
            />
          </div>
          <div className="col-md-1">
            <label className="form-label">Au</label>
            <input
              type="date"
              className="form-control"
              name="dateTo"
              value={workflowFilters.dateTo}
              onChange={handleWorkflowFilterChange}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-striped table-bordered">
            <thead>
              <tr>
                <th>Date</th>
                <th>Action</th>
                <th>Utilisateur</th>
                <th>Departement</th>
                <th>Demande</th>
                <th>Commentaire</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center">
                    Chargement...
                  </td>
                </tr>
              ) : filteredWorkflowLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center">
                    Aucun workflow log trouve.
                  </td>
                </tr>
              ) : (
                filteredWorkflowLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDateTime(log.dateAction)}</td>
                    <td>{log.action || "-"}</td>
                    <td>{log.user?.nom || "-"}</td>
                    <td>{log.department?.nom || "-"}</td>
                    <td>{log.demande?.id || "-"}</td>
                    <td>{log.commentaire || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="workflow-card" style={{ marginBottom: 18 }}>
        <div className="request-list__header">
          <div>
            <h3>CRUD users</h3>
            <p className="page-muted">Creation, modification et suppression des utilisateurs.</p>
          </div>
        </div>

        <form className="row" onSubmit={submitUser} style={{ marginBottom: 16 }}>
          <div className="col-md-3">
            <label className="form-label">Nom</label>
            <input
              className="form-control"
              name="nom"
              value={userForm.nom}
              onChange={handleUserFormChange}
              required
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              name="email"
              value={userForm.email}
              onChange={handleUserFormChange}
              required
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Mot de passe</label>
            <input
              type="password"
              className="form-control"
              name="password"
              value={userForm.password}
              onChange={handleUserFormChange}
              placeholder={editingUserId ? "laisser vide pour garder" : "obligatoire"}
              required={!editingUserId}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Departement</label>
            <select
              className="form-control"
              name="departmentId"
              value={userForm.departmentId}
              onChange={handleUserFormChange}
            >
              <option value="">Aucun</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-1">
            <label className="form-label">Role</label>
            <select
              className="form-control"
              name="roleId"
              value={userForm.roleId}
              onChange={handleUserFormChange}
            >
              <option value="">Aucun</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-1" style={{ paddingTop: 30 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                name="enabled"
                checked={userForm.enabled}
                onChange={handleUserFormChange}
              />
              Actif
            </label>
          </div>
          <div className="col-md-12" style={{ marginTop: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={savingUser}>
              {savingUser ? "Enregistrement..." : editingUserId ? "Mettre a jour" : "Creer utilisateur"}
            </button>
            {editingUserId ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetUserForm}
                style={{ marginLeft: 10 }}
              >
                Annuler
              </button>
            ) : null}
          </div>
        </form>

        <div className="table-responsive">
          <table className="table table-striped table-bordered">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Email</th>
                <th>Departement</th>
                <th>Roles</th>
                <th>Actif</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center">
                    Chargement...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center">
                    Aucun utilisateur.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.nom || "-"}</td>
                    <td>{user.email || "-"}</td>
                    <td>{user.department?.nom || "-"}</td>
                    <td>
                      {Array.isArray(user.roles) && user.roles.length > 0
                        ? user.roles.map((role) => role.nom).join(", ")
                        : "-"}
                    </td>
                    <td>{user.enabled ? "Oui" : "Non"}</td>
                    <td>
                      <button className="btn btn-sm btn-primary" onClick={() => handleEditUser(user)}>
                        Editer
                      </button>{" "}
                      <button className="btn btn-sm btn-secondary" onClick={() => handleDeleteUser(user.id)}>
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="workflow-card" style={{ marginBottom: 18 }}>
        <div className="request-list__header">
          <div>
            <h3>CRUD departement</h3>
            <p className="page-muted">Gestion des departements et de leurs scores.</p>
          </div>
        </div>

        <form className="row" onSubmit={submitDepartment} style={{ marginBottom: 16 }}>
          <div className="col-md-5">
            <label className="form-label">Nom</label>
            <input
              className="form-control"
              name="nom"
              value={departmentForm.nom}
              onChange={handleDepartmentFormChange}
              required
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Score</label>
            <input
              type="number"
              className="form-control"
              name="scores"
              value={departmentForm.scores}
              onChange={handleDepartmentFormChange}
              required
            />
          </div>
          <div className="col-md-4" style={{ paddingTop: 30 }}>
            <button type="submit" className="btn btn-primary" disabled={savingDepartment}>
              {savingDepartment ? "Enregistrement..." : editingDepartmentId ? "Mettre a jour" : "Creer departement"}
            </button>
            {editingDepartmentId ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetDepartmentForm}
                style={{ marginLeft: 10 }}
              >
                Annuler
              </button>
            ) : null}
          </div>
        </form>

        <div className="table-responsive">
          <table className="table table-striped table-bordered">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center">
                    Chargement...
                  </td>
                </tr>
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center">
                    Aucun departement.
                  </td>
                </tr>
              ) : (
                departments.map((department) => (
                  <tr key={department.id}>
                    <td>{department.id}</td>
                    <td>{department.nom || "-"}</td>
                    <td>{department.scores}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleEditDepartment(department)}
                      >
                        Editer
                      </button>{" "}
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleDeleteDepartment(department.id)}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="workflow-card">
        <div className="request-list__header">
          <div>
            <h3>Liste factures</h3>
            <p className="page-muted">Consultation globale des factures avec filtre rapide.</p>
          </div>
        </div>

        <div className="row" style={{ marginBottom: 12 }}>
          <div className="col-md-8">
            <label className="form-label">Recherche</label>
            <input
              className="form-control"
              name="search"
              value={factureFilters.search}
              onChange={handleFactureFilterChange}
              placeholder="Reference, client, livraison..."
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Statut</label>
            <select
              className="form-control"
              name="statut"
              value={factureFilters.statut}
              onChange={handleFactureFilterChange}
            >
              <option value="">Tous</option>
              {facturesByStatut.map((item) => (
                <option key={item.label} value={item.label}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-striped table-bordered">
            <thead>
              <tr>
                <th>ID</th>
                <th>Reference</th>
                <th>Client</th>
                <th>Livraison</th>
                <th>Montant HT</th>
                <th>TVA</th>
                <th>TTC</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center">
                    Chargement...
                  </td>
                </tr>
              ) : filteredFactures.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center">
                    Aucune facture.
                  </td>
                </tr>
              ) : (
                filteredFactures.map((facture) => (
                  <tr key={facture.id}>
                    <td>{facture.id}</td>
                    <td>{facture.reference || "-"}</td>
                    <td>{facture.client?.nom || "-"}</td>
                    <td>{facture.livraison?.reference || facture.livraison?.id || "-"}</td>
                    <td>{facture.montantHt ?? "-"}</td>
                    <td>{facture.tva ?? "-"}</td>
                    <td>{facture.montantTtc ?? "-"}</td>
                    <td>{facture.statut || "-"}</td>
                    <td>{formatDateTime(facture.dateFacture)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}