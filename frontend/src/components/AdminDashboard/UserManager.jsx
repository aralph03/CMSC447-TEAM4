// ========================================================
// File description: Provides full CRUD (Create, Read, Update, Delete) 
//
// This component is used by Admin users to manage
// all user accounts in the Virtual Triage System.
//
// Features:
// - Load all users from backend API
// - Search functionality (by name, username, or email)
// - Pagination
// - Modal for creating and editing users
// - Delete confirmation
// - Optional password change for self-editing
// ========================================================
import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { getUsers, createUser, updateUser, deleteUser 
} from "../../api/api";
import "./MainPanel.css"; // Ensures consistent UMBC theme

export default function UserManager() {
  const [users, setUsers] = useState([]); // Full list of users
  const [filtered, setFiltered] = useState([]); // Filtered list for search
  const [search, setSearch] = useState(""); // Search bar input
  const [loading, setLoading] = useState(false); // Loading indicator
  const [showModal, setShowModal] = useState(false); // Controls modal visibility
  const [editing, setEditing] = useState(null); // Currently editing user
  const [passwordConfirm, setPasswordConfirm] = useState(""); // Confirm password field
  const [currentUserId, setCurrentUserId] = useState(null); // Stores current logged-in user ID

  // ========================================================
  // Load current user ID from JWT token
  // ========================================================
  useEffect(() => {
  const token = localStorage.getItem("authToken"); // Retrieve JWT from localStorage
  console.log("Raw token:", token);
  if (token) {
    try {
      const decoded = jwtDecode(token);
      setCurrentUserId(decoded.User_ID || decoded.id); // Save logged-in user ID
    } catch (err) {
      console.error("Invalid token:", err);
    }
  }
}, []);

  // -----------------------------
  // Pagination state
  // -----------------------------
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // -----------------------------
  // Form state for create/edit modal
  // -----------------------------
  const [formState, setFormState] = useState({
    Full_Name: "",
    User_Name: "",
    User_Email: "",
    User_Phone: "",
    User_Role: "User",
    User_Type: "",
    User_Password: "", // only required for create
  });

  // ========================================================
  // Fetch all users from backend API
  // ========================================================
  const load = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      setUsers(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error("Error loading users", err);
      alert("Failed to load users.");
    }
    setLoading(false);
  };

  // Load data once on component mount
  useEffect(() => {
    load();
  }, []);

  // -----------------------------
  // Search functionality
  // -----------------------------
  const handleSearch = () => {
    if (!search.trim()) {
      setFiltered(users);
      setPage(1);
      return;
    }
    const q = search.toLowerCase();
    const result = users.filter(
      (u) =>
        u.Full_Name.toLowerCase().includes(q) ||
        u.User_Name.toLowerCase().includes(q) ||
        u.User_Email.toLowerCase().includes(q)
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

  // -----------------------------
  // Modal - open for new user
  // -----------------------------
  const openNew = () => {
    setEditing(null);
    setFormState({
      Full_Name: "",
      User_Name: "",
      User_Email: "",
      User_Phone: "",
      User_Role: "User",
      User_Type: "",
      User_Password: "",
    });
    setPasswordConfirm("");
    setShowModal(true);
  };

  // -----------------------------
  // Modal - open for edit user
  // -----------------------------
  const openEdit = (u) => {
    setEditing(u);
    setFormState({
      Full_Name: u.Full_Name,
      User_Name: u.User_Name,
      User_Email: u.User_Email,
      User_Phone: u.User_Phone,
      User_Role: u.User_Role,
      User_Type: u.User_Type,
      User_Password: "", // Optional for editing
    });
    setPasswordConfirm("");
    setShowModal(true);
  };

  // -----------------------------
  // Save user (create or update)
  // -----------------------------
  const handleSave = async () => {
    // Basic validation
    if (!formState.Full_Name || !formState.User_Email) {
      alert("Full name and email are required.");
      return;
    }

    // Admin must have username
    if (formState.User_Role === "Admin" && (!formState.User_Name || formState.User_Name.trim() === "")) {
      alert("Admins must have a username.");
      return;
    }

    // Creating new admin → password required
    if (!editing && formState.User_Role === "Admin") {
      if (!formState.User_Password || formState.User_Password.length < 8) {
        alert("Password must be at least 8 characters.");
        return;
      }
      if (formState.User_Password !== passwordConfirm) {
        alert("Passwords do not match.");
        return;
      }
    }

    // Editing self → password optional but validate if typed
    if (editing && String(editing.User_ID) === String(currentUserId)) {
      if (formState.User_Password) {
        if (formState.User_Password.length < 8) {
          alert("Password must be at least 8 characters.");
          return;
        }
        if (formState.User_Password !== passwordConfirm) {
          alert("Passwords do not match.");
          return;
        }
      }
    }

    setLoading(true);
    try {
      if (editing) {
        await updateUser(editing.User_ID, formState);
        alert("User updated");
      } else {
        await createUser(formState);
        alert("User created");
      }
      await load();
      setShowModal(false);
    } catch (err) {
      console.error("Save error", err);
      alert("Failed to save user");
    }
    setLoading(false);
  };

  // -----------------------------
  // Delete user
  // -----------------------------
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    setLoading(true);
    try {
      await deleteUser(id);
      alert("User deleted");
      await load();
    } catch (err) {
      console.error("Delete error", err);
      alert("Failed to delete user");
    }
    setLoading(false);
  };

  // ======================================================
  // RENDER UI
  // ======================================================
  return (
    <div>
      <h2 className="panel-title">User Manager</h2>

      {/* Search Row */}
      <div className="search-row">
        <input
          className="search-input"
          placeholder="Search Users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-gold" onClick={handleSearch}>
          Search
        </button>
        <button className="btn btn-gold add-btn" onClick={openNew}>
          + Add New User
        </button>
      </div>

      {loading && <div>Loading...</div>}

      {/* Users Table */}
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Full Name</th>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((u) => (
            <tr key={u.User_ID}>
              <td>{u.User_ID}</td>
              <td>{u.Full_Name}</td>
              <td>{u.User_Name}</td>
              <td>{u.User_Email}</td>
              <td>{u.User_Role}</td>
              <td>{u.User_Type}</td>
              <td>
                {/* Edit Button */}
                <button className="btn btn-dark" onClick={() => openEdit(u)}>
                  Edit
                </button>{" "}
                {/* Delete Button */}
                <button className="btn btn-danger" onClick={() => handleDelete(u.User_ID)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {/* No results after searching */}
          {paginated.length === 0 && !loading && (
            <tr>
              <td colSpan={7} style={{ textAlign: "center", padding: 20 }}>
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
        <span className="page-number">{page} / {totalPages}</span>
        <button
          className="btn btn-dark"
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <h3>{editing ? "Edit User" : "Add New User"}</h3>

            <label>Full Name</label>
            <input
              className="form-input"
              value={formState.Full_Name}
              onChange={(e) => setFormState({ ...formState, Full_Name: e.target.value })}
            />

            <label>Username</label>
            <input
              className="form-input"
              value={formState.User_Name}
              onChange={(e) => setFormState({ ...formState, User_Name: e.target.value })}
            />

            <label>Email</label>
            <input
              className="form-input"
              value={formState.User_Email}
              onChange={(e) => setFormState({ ...formState, User_Email: e.target.value })}
            />

            <label>Phone</label>
            <input
              className="form-input"
              value={formState.User_Phone}
              onChange={(e) => setFormState({ ...formState, User_Phone: e.target.value })}
            />

            <label>Role</label>
            <select
              className="form-select"
              value={formState.User_Role}
              onChange={(e) => setFormState({ ...formState, User_Role: e.target.value })}
            >
              <option>Admin</option>
              <option>User</option>
            </select>

            <label>Type</label>
            <select
              className="form-select"
              value={formState.User_Type}
              onChange={(e) => setFormState({ ...formState, User_Type: e.target.value })}
            >
              <option value="">--select--</option>
              <option>Undergraduate Student</option>
              <option>Graduate Student</option>
              <option>Faculty</option>
              <option>Prospective Student</option>
              <option>Ph.D. Student</option>
              <option>Visitor</option>
            </select>

            {/* Password section for self or new user */}
            {(!editing || String(editing?.User_ID) === String(currentUserId)) && (
              <>
                <label>{editing ? "New Password (optional)" : "Password"}</label>
                <input
                  className="form-input"
                  type="password"
                  value={formState.User_Password ?? ""}
                  onChange={(e) => setFormState({ ...formState, User_Password: e.target.value })}
                  placeholder={editing ? "Leave blank to keep current password" : ""}
                />

                <label>Confirm Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                />
              </>
            )}

            {/* Modal buttons */}
            <div className="modal-buttons">
              <button className="btn btn-gold" onClick={handleSave}>
                {editing ? "Save Changes" : "Create User"}
              </button>
              <button className="btn btn-dark" onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}