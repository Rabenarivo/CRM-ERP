import { useState } from "react";
import { login } from "../../services/authService";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      await login(email, password);


      window.location.href = "/dashboard";
    } catch (err) {
      const apiMessage =
        typeof err?.response?.data === "string"
          ? err.response.data
          : err?.response?.status === 401
            ? "Email ou mot de passe incorrect"
            : "Connexion impossible";
      setError(apiMessage);
    }
  };

  return (
    <div className="auth-page">
      <div className="container">
        <div className="row">
          <div className="col-sm-6 col-sm-offset-3 col-md-4 col-md-offset-4">
            <div className="panel panel-default auth-panel">
              <div className="panel-heading text-center">
                <h3 className="panel-title">Connexion</h3>
              </div>
              <div className="panel-body">
                <form onSubmit={handleLogin}>
                  {error ? <div className="alert alert-danger">{error}</div> : null}

                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      type="email"
                      className="form-control"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">Mot de passe</label>
                    <input
                      id="password"
                      type="password"
                      className="form-control"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-block">
                    Login
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
