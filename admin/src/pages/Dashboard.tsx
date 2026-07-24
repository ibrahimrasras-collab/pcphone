import { useEffect, useState } from "react";
import { adminApi } from "../api";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentCalls, setRecentCalls] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([adminApi.stats(), adminApi.recentCalls(10)])
      .then(([s, c]) => {
        setStats(s);
        setRecentCalls(c);
      });
  }, []);

  if (!stats) return <div>Loading…</div>;

  return (
    <div>
      <h1 style={title}>Dashboard Overview</h1>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Users" value={stats.users.total} />
        <StatCard label="Active Users" value={stats.users.active} color="#16a34a" />
        <StatCard label="DIDs Assigned" value={stats.dids.assigned} />
        <StatCard label="DIDs Available" value={stats.dids.available} color="#0891b2" />
        <StatCard label="Calls Today" value={stats.calls.today} color="#7c3aed" />
        <StatCard label="Voicemails" value={stats.voicemails.total} />
        <StatCard label="Unread Voicemails" value={stats.voicemails.unread} color="#dc2626" />
        <StatCard label="Revenue" value={`$${stats.revenue.total}`} color="#16a34a" />
      </div>

      {/* Recent calls */}
      <div style={card}>
        <h2 style={subtitle}>Recent Calls</h2>
        <table style={table}>
          <thead>
            <tr>
              <th>Direction</th>
              <th>From</th>
              <th>To</th>
              <th>Status</th>
              <th>Duration</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {recentCalls.map((call) => (
              <tr key={call.id}>
                <td>{call.direction === "inbound" ? "↓ In" : "↑ Out"}</td>
                <td>{call.fromNumber}</td>
                <td>{call.toNumber}</td>
                <td>{call.status}</td>
                <td>{call.durationSeconds ?? 0}s</td>
                <td>{new Date(call.startedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = "#007AFF" }: { label: string; value: any; color?: string }) {
  return (
    <div style={card}>
      <div style={{ color: "#6b7280", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
    </div>
  );
}

const title: React.CSSProperties = { fontSize: 24, fontWeight: 700, marginBottom: 16 };
const subtitle: React.CSSProperties = { fontSize: 16, fontWeight: 600, marginBottom: 12 };
const card: React.CSSProperties = { background: "#fff", padding: 20, borderRadius: 8, border: "1px solid #e5e7eb" };
const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 13 };
