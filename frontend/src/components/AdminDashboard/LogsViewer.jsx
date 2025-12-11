// ========================================================
// File description: Provides read-only viewing of all logs
//
// This component is used by Admin users to monitor
// system activity including user queries, responses,
// and status of FAQs. Supports search and pagination.
// ========================================================
import React, { useEffect, useState } from "react";
import { getLogs } from "../../api/api";
import "./MainPanel.css"; // Ensures consistent UMBC theme

export default function LogsViewer() {
  // State storing all logs from backend
  const [logs, setLogs] = useState([]);

  // State storing filtered logs (used for search)
  const [filtered, setFiltered] = useState([]);

  // search bar input
  const [search, setSearch] = useState("");

  // loading indicator for API calls
  const [loading, setLoading] = useState(false);

  // ------------------------------
  // Pagination
  // ------------------------------
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // ========================================================
  // Fetches all logs from the backend API.
  // Updates both logs and filtered lists.
  // ========================================================
  const load = async () => {
    setLoading(true);
    try {
      const res = await getLogs();
      setLogs(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error("Error loading logs", err);
      alert("Failed to load logs.");
    }
    setLoading(false);
  };

  // Load logs once when component mounts
  useEffect(() => { 
    load(); 
  }, []);

  // -----------------------------
  // Search functionality
  // -----------------------------
  const handleSearch = () => {
    // Reset filter if search is empty
    if (!search.trim()) {
      setFiltered(logs);
      setPage(1);
      return;
    }
    const q = search.toLowerCase();
    // Filter logs by multiple fields
    const result = logs.filter(
      (l) =>
        String(l.Log_ID).includes(q) ||
        String(l.User_Log_ID).includes(q) ||
        String(l.Category_ID).includes(q) ||
        String(l.FAQ_ID).includes(q) ||
        l.Query?.toLowerCase().includes(q) ||
        l.Response?.toLowerCase().includes(q) ||
        l.Status?.toLowerCase().includes(q)
    );
    setFiltered(result);
    setPage(1); // Reset to first page after search
  };

  // -----------------------------
  // Pagination
  // -----------------------------
  const start = (page - 1) * pageSize; // Starting index for current page
  const paginated = filtered.slice(start, start + pageSize); // Items for current page
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;

  // ======================================================
  // RENDER UI
  // ======================================================
  return (
    <div>
      <h2 className="panel-title">Logs (Read-only)</h2>

      {/* Search Row*/}
      <div className="search-row">
        <input
          className="search-input"
          placeholder="Search logs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-gold" onClick={handleSearch}>
          Search
        </button>
      </div>

      {loading && <div>Loading...</div>}

      {/* Logs Table */}
      <table className="data-table" aria-live="polite">
        <thead>
          <tr>
            <th>Log ID</th>
            <th>User</th>
            <th>Category</th>
            <th>FAQ</th>
            <th>Query</th>
            <th>Response</th>
            <th>Status</th>
            <th>Timestamp</th>
          </tr>
        </thead>

        <tbody>
          {paginated.map((log) => (
            <tr key={log.Log_ID}>
              <td>{log.Log_ID}</td>
              <td>{log.User_Log_ID}</td>
              <td>{log.Category_ID}</td>
              <td>{log.FAQ_ID}</td>
              <td style={{ maxWidth: 300 }}>{log.Query}</td>
              <td style={{ maxWidth: 300 }}>{log.Response}</td>
              <td>{log.Status}</td>
              <td>{log.Timestamp}</td>
            </tr>
          ))}

          {/* No results after searching */}
          {paginated.length === 0 && !loading && (
            <tr>
              <td colSpan={8} style={{ textAlign: "center", padding: 20 }}>
                No results found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="pagination">
        <button
          className="btn btn-dark"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Prev
        </button>

        <span className="page-number">
          {page} / {totalPages}
        </span>

        <button
          className="btn btn-dark"
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
         Next
        </button>
      </div>
    </div>
  );
}