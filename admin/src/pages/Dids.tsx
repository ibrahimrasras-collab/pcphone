import { useEffect, useState } from "react";
import { adminApi } from "../api";

export default function Dids() {
  const [dids, setDids] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = async () => {
    const res = await adminApi.listDids(page);
    setDids(res.data);
    setTotal(res.meta.total);
  };

  useEffect(() => { load(); }, [page]);

  return (
    <div>
      <h1 style={title}>Phone Numbers (DIDs)</h1>
      <div style={card}>
        <table style={table}>
          <thead>
            <tr>
              <th>Phone Number</th>
              <th>Assigned To</th>
              <th>Status</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {dids.map((d) => (
              <tr key={d.id}>
                <td style={{ fontFamily: "monospace", fontWeight: 600 }}>{d.phoneNumber}</td>
                <td>{d.userName ? `${d.userName} · ${d.userEmail}` : "—"}</td>
                <td>{d.isActive ? "Active" : "Inactive"}</td>
                <td>{new Date(d.createdAt).toLocaleDateString()}</td>
                <td>
                  {d.assignedTo ? (
                    <button style={smallBtn} onClick={async () => {
                      await adminApi.unassignDid(d.id);
                      load();
                    }}>Unassign</button>
                  ) : (
                    <span style={{ color: "#9ca3af" }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
        <div style={{ fontSize: 13, padding: "4px 12px" }}>Page {page} — {total} numbers</div>
        <button disabled={page * 20 >= total} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}

const title: React.CSSProperties = { fontSize: 24, fontWeight: 700, marginBottom: 16 };
const card: React.CSSProperties = { background: "#fff", borderRadius: 8, border: "1px solid #e5e7eb", overflow: "auto" };
const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 13 };
const smallBtn: React.CSSProperties = { padding: "4px 10px", borderRadius: 4, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" };
