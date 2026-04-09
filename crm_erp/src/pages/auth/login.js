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
    <div style={styles.container}>
      <form onSubmit={handleLogin} style={styles.form}>
        <h2>Login</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <button type="submit" style={styles.button}>
          Login
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
  },
  form: {
    width: "300px",
    padding: "20px",
    border: "1px solid #ccc",
  },
  input: {
    width: "100%",
    margin: "10px 0",
    padding: "10px",
  },
  button: {
    width: "100%",
    padding: "10px",
  },
};