import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "./auth";

export default function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{
        width: 220,
        padding: 16,
        borderRight: "1px solid #e5e7eb",
        background: "#1f2937",
        color: "#fff",
      }}>
        <div style={{
          fontWeight: 700,
          fontSize: 20,
          marginBottom: 24,
          letterSpacing: "-0.5px",
        }}>
          PCPhone
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <NavLink to="/" end style={navStyle}>Dashboard</NavLink>
          <NavLink to="/users" style={navStyle}>Users</NavLink>
          <NavLink to="/dids" style={navStyle}>Phone Numbers</NavLink>
          <NavLink to="/calls" style={navStyle}>Call History</NavLink>
        </nav>
        <div style={{
          marginTop: 32,
          paddingTop: 16,
          borderTop: "1px solid #374151",
          fontSize: 12,
          color: "#9ca3af",
        }}>
          Signed in as
          <div style={{ color: "#fff", marginTop: 4 }}>{user?.name}</div>
          <button onClick={handleLogout} style={logoutBtn}>Logout</button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: 24, background: "#f9fafb" }}>
        <Outlet />
      </main>
    </div>
  );
}

const navStyle = ({ isActive }: any) => ({
  display: "block",
  padding: "8px 12px",
  borderRadius: 6,
  color: isActive ? "#1f2937" : "#d1d5db",
  background: isActive ? "#fff" : "transparent",
  textDecoration: "none",
  fontWeight: isActive ? 600 : 400,
  fontSize: 14,
});

const logoutBtn: React.CSSProperties = {
  marginTop: 12,
  padding: "6px 12px",
  background: "transparent",
  border: "1px solid #4b5563",
  color: "#d1d5db",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 12,
  width: "100%",
};
