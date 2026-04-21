import { useEffect, useMemo, useState } from "react";
import { getWorkflowLogs } from "../../api/workflowLogApi";
import { getUsers } from "../../api/userAdminApi";
import { getDepartments } from "../../api/departmentApi";
import Type120AdminNav from "../../components/Type120AdminNav";

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

export default function Type120WorkflowPage() {
  const [workflowLogs, setWorkflowLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    action: "",
    userId: "",
    departmentId: "",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const [logsRes, usersRes, departmentsRes] = await Promise.allSettled([
          getWorkflowLogs(),
          getUsers(),
          getDepartments(),
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
      } catch (loadError) {
        setError("Impossible de charger les workflow logs.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const workflowByAction = useMemo(() => {
    const counter = new Map();
    workflowLogs.forEach((log) => {
      const label = String(log?.action || "SANS_ACTION");
      counter.set(label, (counter.get(label) || 0) + 1);
    });
    return Array.from(counter.entries()).map(([label]) => label);
  }, [workflowLogs]);

  const filteredWorkflowLogs = useMemo(() => {
    const search = normalize(filters.search);
    const action = normalize(filters.action);
    const userId = normalize(filters.userId);
    const departmentId = normalize(filters.departmentId);
    const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : null;
    const dateTo = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59`) : null;

    return workflowLogs.filter((log) => {
      const logDate = log?.dateAction ? new Date(log.dateAction) : null;
      const matchesSearch =
        !search ||
        [log?.action, log?.commentaire, log?.user?.nom, log?.department?.nom]
          .filter(Boolean)
          .some((value) => normalize(value).includes(search));
      const matchesAction = !action || normalize(log?.action) === action;
      const matchesUser = !userId || String(log?.user?.id || "") === userId;
      const matchesDepartment = !departmentId || String(log?.department?.id || "") === departmentId;
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
  }, [filters, workflowLogs]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  return (
    <div className="page-card">
      <Type120AdminNav />

      {error ? <div className="alert alert-warning page-alert">{error}</div> : null}

      <section className="workflow-card">
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
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Action, commentaire, user..."
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Action</label>
            <select className="form-control" name="action" value={filters.action} onChange={handleFilterChange}>
              <option value="">Toutes</option>
              {workflowByAction.map((actionLabel) => (
                <option key={actionLabel} value={actionLabel}>
                  {actionLabel}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Utilisateur</label>
            <select className="form-control" name="userId" value={filters.userId} onChange={handleFilterChange}>
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
              value={filters.departmentId}
              onChange={handleFilterChange}
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
            <input type="date" className="form-control" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} />
          </div>
          <div className="col-md-1">
            <label className="form-label">Au</label>
            <input type="date" className="form-control" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} />
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
                <tr><td colSpan="6" className="text-center">Chargement...</td></tr>
              ) : filteredWorkflowLogs.length === 0 ? (
                <tr><td colSpan="6" className="text-center">Aucun workflow log trouve.</td></tr>
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
    </div>
  );
}
