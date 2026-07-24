import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "#1f2937" }}>
      <form onSubmit={handleSubmit} style={{
        background: "#fff", padding: 32, borderRadius: 12,
        minWidth: 360, boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>
          PCPhone Admin
        </h1>
        <p style={{ color: "#6b7280", textAlign: "center", marginBottom: 24, fontSize: 14 }}>
          Sign in with an admin account
        </p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          style={input}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={input}
        />
        {error && (
          <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</div>
        )}
        <button type="submit" disabled={loading} style={btn}>
          {loading ? "Logging in…" : "Login"}
        </button>
      </form>
    </div>
  );
}

const input: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  marginBottom: 12,
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 14,
  boxSizing: "border-box",
};

const btn: React.CSSProperties = {
  width: "100%",
  padding: "10px 16px",
  background: "#007AFF",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};
