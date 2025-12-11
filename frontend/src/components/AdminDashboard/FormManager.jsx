// ========================================================
// File description: Provides full CRUD (Create, Read, Update, Delete) 
//
// This component is used by Admin users to manage 
// all department forms used for triage purposes. 
// It includes loading, searching, pagination, and modal-based 
// editing/creation for forms.
// ========================================================
import React, { useEffect, useState } from "react";
import { getForms, createForm, updateForm, deleteForm, getUsers, getCategories 
} from "../../api/api";
import "./MainPanel.css"; // Ensures consistent UMBC theme

export default function FormManager() {
  // All forms fetched from backend
  const [forms, setForms] = useState([]);

  // Filtered forms after search
  const [filtered, setFiltered] = useState([]);

  // Search bar input
  const [search, setSearch] = useState("");

  // Categories used for forms (from backend)
  const [categories, setCategories] = useState([]);

  // Users used for staff contact dropdown
  const [users, setUsers] = useState([]);

  // Loading indicator for API calls
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // Pagination state
  // -----------------------------
  const [page, setPage] = useState(1); // current page
  const pageSize = 10; // items per page

  // -----------------------------
  // Modal state
  // -----------------------------
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // currently editing form
  const [formState, setFormState] = useState({
    Form_Name: "",
    Form_URL: "",
    requires_staff: false,
    staff_contact_id: "",
    Form_Target_User_Type: "",
  });

  // ========================================================
  // Fetches all forms, categories, and users from backend API.
  // Updates both main and filtered lists for display.
  // ==============================================================
  const load = async () => {
    setLoading(true);
    try {
      const [formsRes, catsRes, usersRes] = await Promise.all([getForms(), getCategories(), getUsers()]);
      setForms(formsRes.data);
      setFiltered(formsRes.data);
      setCategories(catsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error("Error loading forms", err);
      alert("Failed to load forms.");
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
      setFiltered(forms);
      setPage(1);
      return;
    }
    const q = search.toLowerCase();
    // Filter forms by name or URL
    const result = forms.filter(
      (f) =>
        f.Form_Name.toLowerCase().includes(q) ||
        f.Form_URL.toLowerCase().includes(q)
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
  // Modal - open for new
  // -----------------------------
  const openNew = () => {
    setEditing(null);
    setFormState({
      Form_Name: "",
      Form_URL: "",
      requires_staff: false,
      staff_contact_id: "",
      Form_Target_User_Type: "",
    });
    setShowModal(true);
  };

  // -----------------------------
  // Modal - open for edit
  // -----------------------------
  const openEdit = (f) => {
    setEditing(f);
    setFormState({
      Form_Name: f.Form_Name || "",
      Form_URL: f.Form_URL || "",
      requires_staff: f.requires_staff || false,
      staff_contact_id: f.staff_contact_id || "",
      Form_Target_User_Type: f.Form_Target_User_Type || "",
    });
    setShowModal(true);
  };

  // -----------------------------
  // Save Form (create or update)
  // -----------------------------
  const handleSave = async () => {
    if (!formState.Form_Name || !formState.Form_URL) {
      alert('Form Name and URL are required.');
      return;
    }
    setLoading(true);
    try {
      if (editing) {
        await updateForm(editing.Form_ID, formState);
        alert("Form updated");
      } else {
        await createForm(formState);
        alert("Form created");
      }
      await load();
      setShowModal(false);
    } catch (err) {
      console.error("Save error", err);
      alert("Failed to save form.");
    }
    setLoading(false);
  };

  // -----------------------------
  // Delete Form
  // -----------------------------  
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this form?")) return; // confirmation dialog
    setLoading(true);
    try {
      await deleteForm(id);
      alert("Form deleted");
      await load();
    } catch (err) {
      console.error("Delete error", err);
      alert("Failed to delete form.");
    }
    setLoading(false);
  };

  // ======================================================
  // RENDER UI
  // ======================================================
  return (
    <div>
      <h2 className="panel-title">Form Manager</h2>

      {/* Search & Add */}
      <div className="search-row">
        <input
          className="search-input"
          placeholder="Search Forms..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-gold" onClick={handleSearch}>
          Search
        </button>
        <button className="btn btn-gold add-btn" onClick={openNew}>
          + Add New Form
        </button>
      </div>

      {loading && <div>Loading...</div>}

      {/* Forms Table */}
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Form Name</th>
            <th>URL</th>
            <th>Requires Staff</th>
            <th>Staff Contact</th>
            <th>Target Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((f) => (
            <tr key={f.Form_ID}>
              <td>{f.Form_ID}</td>
              <td>{f.Form_Name}</td>
              <td>{f.Form_URL}</td>
              <td>{f.requires_staff ? "Yes" : "No"}</td>
              <td>{users.find((u) => u.User_ID === f.staff_contact_id)?.Full_Name || ""}</td>
              <td>{f.Form_Target_User_Type}</td>
              <td>
                {/* Edit Button */}
                <button className="btn btn-dark" onClick={() => openEdit(f)}>
                  Edit
                </button>{" "}
                {/* Delete Button */}
                <button className="btn btn-danger" onClick={() => handleDelete(f.Form_ID)}>
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

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <h3>{editing ? "Edit Form" : "Add New Form"}</h3>

            <label>Form Name</label>
            <input
              className="form-input"
              value={formState.Form_Name}
              onChange={(e) =>
                setFormState({ ...formState, Form_Name: e.target.value })
              }
            />

            <label>Form URL</label>
            <input
              className="form-input"
              value={formState.Form_URL}
              onChange={(e) =>
                setFormState({ ...formState, Form_URL: e.target.value })
              }
            />

            <label>
              Requires Staff
              <input
                type="checkbox"
                checked={formState.requires_staff}
                onChange={(e) =>
                  setFormState({ ...formState, requires_staff: e.target.checked })
                }
              />
            </label>

            <label>Staff Contact</label>
            <select
              className="form-select"
              value={formState.staff_contact_id || ""}
              onChange={(e) =>
                setFormState({ ...formState, staff_contact_id: e.target.value })
              }
            >
              <option value="">None</option>
              {users.map((u) => (
                <option key={u.User_ID} value={u.User_ID}>
                  {u.Full_Name}
                </option>
              ))}
            </select>

            <label>Target Type</label>
            <select
              className="form-select"
              value={formState.Form_Target_User_Type || ""}
              onChange={(e) =>
                setFormState({ ...formState, Form_Target_User_Type: e.target.value })
              }
            >
              <option value="">--select--</option>
              <option>Faculty</option>
              <option>Staff</option>
              <option>Faculty & Staff</option>
              <option>Graduate Student</option>
              <option>Ph.D. Student</option>
            </select>

            <div className="modal-buttons">
              <button className="btn btn-gold" onClick={handleSave}>
                {editing ? "Save Changes" : "Create Form"}
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