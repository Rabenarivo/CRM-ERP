import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div style={{ padding: "24px" }}>
      <h1>Access denied</h1>
      <p>You do not have permission to access this page.</p>
      <Link to="/dashboard">Back to dashboard</Link>
    </div>
  );
}
