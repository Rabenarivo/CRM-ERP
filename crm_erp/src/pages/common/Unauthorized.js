import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="page-card">
      <p className="page-eyebrow">Erreur d'acces</p>
      <h2>Access denied</h2>
      <p className="page-muted">You do not have permission to access this page.</p>
      <Link className="btn btn-default" to="/dashboard">
        Back to dashboard
      </Link>
    </div>
  );
}
