import { useEffect, useState } from "react";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../../api/departmentApi";
import Type120AdminNav from "../../components/Type120AdminNav";

const emptyDepartmentForm = {
  nom: "",
  scores: "",
};

export default function Type120DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [departmentForm, setDepartmentForm] = useState(emptyDepartmentForm);
  const [editingDepartmentId, setEditingDepartmentId] = useState(null);
  const [savingDepartment, setSavingDepartment] = useState(false);

  const refreshData = async () => {
    setLoading(true);
    setError("");
    try {
      const departmentsRes = await getDepartments();
      setDepartments(Array.isArray(departmentsRes.data) ? departmentsRes.data : []);
    } catch (loadError) {
      setDepartments([]);
      setError("Impossible de charger les departements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleDepartmentFormChange = (event) => {
    const { name, value } = event.target;
    setDepartmentForm((current) => ({ ...current, [name]: value }));
  };

  const resetDepartmentForm = () => {
    setDepartmentForm(emptyDepartmentForm);
    setEditingDepartmentId(null);
  };

  const handleEditDepartment = (department) => {
    setEditingDepartmentId(department.id);
    setDepartmentForm({
      nom: department?.nom || "",
      scores: department?.scores != null ? String(department.scores) : "",
    });
  };

  const submitDepartment = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
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
      <Type120AdminNav />

      {error ? <div className="alert alert-warning page-alert">{error}</div> : null}
      {message ? <div className="alert alert-success page-alert">{message}</div> : null}

      <section className="workflow-card">
        <div className="request-list__header">
          <div>
            <h3>CRUD departement</h3>
            <p className="page-muted">Gestion des departements et de leurs scores.</p>
          </div>
        </div>

        <form className="row" onSubmit={submitDepartment} style={{ marginBottom: 16 }}>
          <div className="col-md-5">
            <label className="form-label">Nom</label>
            <input className="form-control" name="nom" value={departmentForm.nom} onChange={handleDepartmentFormChange} required />
          </div>
          <div className="col-md-3">
            <label className="form-label">Score</label>
            <input type="number" className="form-control" name="scores" value={departmentForm.scores} onChange={handleDepartmentFormChange} required />
          </div>
          <div className="col-md-4" style={{ paddingTop: 30 }}>
            <button type="submit" className="btn btn-primary" disabled={savingDepartment}>
              {savingDepartment ? "Enregistrement..." : editingDepartmentId ? "Mettre a jour" : "Creer departement"}
            </button>
            {editingDepartmentId ? (
              <button type="button" className="btn btn-secondary" onClick={resetDepartmentForm} style={{ marginLeft: 10 }}>
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
                <tr><td colSpan="4" className="text-center">Chargement...</td></tr>
              ) : departments.length === 0 ? (
                <tr><td colSpan="4" className="text-center">Aucun departement.</td></tr>
              ) : (
                departments.map((department) => (
                  <tr key={department.id}>
                    <td>{department.id}</td>
                    <td>{department.nom || "-"}</td>
                    <td>{department.scores}</td>
                    <td>
                      <button className="btn btn-sm btn-primary" onClick={() => handleEditDepartment(department)}>Editer</button>{" "}
                      <button className="btn btn-sm btn-secondary" onClick={() => handleDeleteDepartment(department.id)}>Supprimer</button>
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
