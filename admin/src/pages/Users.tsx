import { useEffect, useState } from "react";
import { adminApi } from "../api";

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    adminApi.listUsers(page, search).then((res) => {
      setUsers(res.data);
      setTotal(res.meta.total);
    });
  }, [page]);

  return (
    <div>
      <h1 style={title}>Users</h1>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users…" style={searchInput} />
      <div style={card}>
        <table style={table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Extension</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.extension ?? "—"}</td>
                <td>{u.plan}</td>
                <td style={{ color: u.isActive ? "#16a34a" : "#dc2626" }}>
                  {u.isActive ? "Active" : "Disabled"}
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  <button style={smallBtn} onClick={async () => {
                    await adminApi.updateUser(u.id, { isActive: !u.isActive });
                    const res = await adminApi.listUsers(page);
                    setUsers(res.data);
                  }}>
                    {u.isActive ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
        <div style={{ fontSize: 13, padding: "4px 12px" }}>Page {page} — {total} users</div>
        <button disabled={page * 20 >= total} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}

const title: React.CSSProperties = { fontSize: 24, fontWeight: 700, marginBottom: 16 };
const searchInput: React.CSSProperties = { width: "100%", padding: 10, borderRadius: 6, border: "1px solid #d1d5db", marginBottom: 12, boxSizing: "border-box" };
const card: React.CSSProperties = { background: "#fff", borderRadius: 8, border: "1px solid #e5e7eb", overflow: "auto" };
const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 13 };
const smallBtn: React.CSSProperties = { padding: "4px 10px", borderRadius: 4, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" };
