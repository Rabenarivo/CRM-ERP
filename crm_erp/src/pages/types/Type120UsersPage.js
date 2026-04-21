import { useEffect, useState } from "react";
import { getUsers, createUser, updateUser, deleteUser } from "../../api/userAdminApi";
import { getDepartments } from "../../api/departmentApi";
import { getRoles } from "../../api/roleApi";
import Type120AdminNav from "../../components/Type120AdminNav";

const emptyUserForm = {
  nom: "",
  email: "",
  password: "",
  departmentId: "",
  roleId: "",
  enabled: true,
};

export default function Type120UsersPage() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [editingUserId, setEditingUserId] = useState(null);
  const [savingUser, setSavingUser] = useState(false);

  const refreshData = async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, departmentsRes, rolesRes] = await Promise.allSettled([
        getUsers(),
        getDepartments(),
        getRoles(),
      ]);

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
    } catch (loadError) {
      setError("Impossible de charger les utilisateurs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleUserFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setUserForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetUserForm = () => {
    setUserForm(emptyUserForm);
    setEditingUserId(null);
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

  const submitUser = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
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

  return (
    <div className="page-card">
      <Type120AdminNav />

      {error ? <div className="alert alert-warning page-alert">{error}</div> : null}
      {message ? <div className="alert alert-success page-alert">{message}</div> : null}

      <section className="workflow-card">
        <div className="request-list__header">
          <div>
            <h3>CRUD users</h3>
            <p className="page-muted">Creation, modification et suppression des utilisateurs.</p>
          </div>
        </div>

        <form className="row" onSubmit={submitUser} style={{ marginBottom: 16 }}>
          <div className="col-md-3">
            <label className="form-label">Nom</label>
            <input className="form-control" name="nom" value={userForm.nom} onChange={handleUserFormChange} required />
          </div>
          <div className="col-md-3">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" name="email" value={userForm.email} onChange={handleUserFormChange} required />
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
            <select className="form-control" name="departmentId" value={userForm.departmentId} onChange={handleUserFormChange}>
              <option value="">Aucun</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>{department.nom}</option>
              ))}
            </select>
          </div>
          <div className="col-md-1">
            <label className="form-label">Role</label>
            <select className="form-control" name="roleId" value={userForm.roleId} onChange={handleUserFormChange}>
              <option value="">Aucun</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>{role.nom}</option>
              ))}
            </select>
          </div>
          <div className="col-md-1" style={{ paddingTop: 30 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="checkbox" name="enabled" checked={userForm.enabled} onChange={handleUserFormChange} />
              Actif
            </label>
          </div>
          <div className="col-md-12" style={{ marginTop: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={savingUser}>
              {savingUser ? "Enregistrement..." : editingUserId ? "Mettre a jour" : "Creer utilisateur"}
            </button>
            {editingUserId ? (
              <button type="button" className="btn btn-secondary" onClick={resetUserForm} style={{ marginLeft: 10 }}>
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
                <tr><td colSpan="7" className="text-center">Chargement...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="7" className="text-center">Aucun utilisateur.</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.nom || "-"}</td>
                    <td>{user.email || "-"}</td>
                    <td>{user.department?.nom || "-"}</td>
                    <td>{Array.isArray(user.roles) && user.roles.length > 0 ? user.roles.map((role) => role.nom).join(", ") : "-"}</td>
                    <td>{user.enabled ? "Oui" : "Non"}</td>
                    <td>
                      <button className="btn btn-sm btn-primary" onClick={() => handleEditUser(user)}>Editer</button>{" "}
                      <button className="btn btn-sm btn-secondary" onClick={() => handleDeleteUser(user.id)}>Supprimer</button>
                    </td>
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
