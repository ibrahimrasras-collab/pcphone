import { useEffect, useState } from "react";
import { adminApi } from "../api";

export default function Calls() {
  const [calls, setCalls] = useState<any[]>([]);

  useEffect(() => {
    adminApi.recentCalls(100).then(setCalls);
  }, []);

  return (
    <div>
      <h1 style={title}>Call History</h1>
      <div style={card}>
        <table style={table}>
          <thead>
            <tr>
              <th>Direction</th>
              <th>From</th>
              <th>To</th>
              <th>Status</th>
              <th>Duration</th>
              <th>User</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {calls.map((c) => (
              <tr key={c.id}>
                <td>{c.direction === "inbound" ? "↓ In" : "↑ Out"}</td>
                <td>{c.fromNumber}</td>
                <td>{c.toNumber}</td>
                <td style={{
                  color: c.status === "completed" ? "#16a34a" :
                         c.status === "no-answer" ? "#dc2626" : "#6b7280",
                }}>{c.status}</td>
                <td>{c.durationSeconds ?? 0}s</td>
                <td>{c.userName ?? c.userEmail ?? "—"}</td>
                <td>{new Date(c.startedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const title: React.CSSProperties = { fontSize: 24, fontWeight: 700, marginBottom: 16 };
const card: React.CSSProperties = { background: "#fff", borderRadius: 8, border: "1px solid #e5e7eb", overflow: "auto" };
const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 13 };
