// ========================================================
// File description: Provides full CRUD (Create, Read, Update, Delete)
// 
// This component is used by Admin users to manage
// all FAQ entries, including their questions, answers,
// categories, form links, escalation contacts, and target audience.
// ========================================================
import React, { useEffect, useState } from "react";
import { getCategories, createCategory, updateCategory, deleteCategory 
} from "../../api/api";
import "./MainPanel.css"; // Ensures consistent UMBC theme

export default function CategoryManager() {
  // State storing all categories fetched from backend
  const [categories, setCategories] = useState([]);

  // State storing filtered categories (used for search)
  const [filtered, setFiltered] = useState([]);

  // Search bar input
  const [search, setSearch] = useState("");

  // Loading indicator for API calls
  const [loading, setLoading] = useState(false);

  // ------------------------------
  // Pagination
  // ------------------------------
  const [page, setPage] = useState(1); // Current page
  const pageSize = 10; // Number of items per page

  // ------------------------------
  // Modal State
  // ------------------------------
  const [showModal, setShowModal] = useState(false); // Controls modal visibility
  const [editing, setEditing] = useState(null); // If editing an existing category
  const [formState, setFormState] = useState({ Category_Name: "" }); // Form data


// ========================================================
// Fetches all categories from the backend API.
// Updates both categories and filtered lists.
// ========================================================
  const load = async () => {
    setLoading(true);
    try {
      const res = await getCategories();
      setCategories(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error("Error loading categories", err);
      alert("Failed to load categories.");
    }
    setLoading(false);
  };

  // Load categories once when component mounts
  useEffect(() => {
    load();
  }, []);

  // ------------------------------
  // Search
  // ------------------------------
  const handleSearch = () => {
    if (!search.trim()) {
      setFiltered(categories);
      setPage(1);
      return;
    }
    const q = search.toLowerCase();
    const result = categories.filter(
      (c) =>
      String(c.Category_Name || "").toLowerCase().includes(q)
    );
    setFiltered(result);
    setPage(1); // Reset to page 1 after search
  };


  // ------------------------------
  // Pagination
  // ------------------------------
  const start = (page - 1) * pageSize; // Starting index for current page
  const paginated = filtered.slice(start, start + pageSize); // Items for current page
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;

  // -----------------------------
  // Modal - open for new
  // -----------------------------
  const openNew = () => {
    setEditing(null);
    setFormState({ Category_Name: "" });
    setShowModal(true);
  };

  // -----------------------------
  // Modal - open for edit
  // -----------------------------
  const openEdit = (item) => {
    setEditing(item);
    setFormState({ Category_Name: item.Category_Name || "" });
    setShowModal(true);
  };


  // ------------------------------
  // CRUD Operations
  // ------------------------------

  // ========================================================
  // Handles both creating & updating a category.
  // Uses editing state to determine which action.
  // ========================================================
  const handleSave = async () => {
    if (!formState.Category_Name.trim()) {
      alert("Category name is required.");
      return;
    }
    setLoading(true);
    try {
      if (editing) {
        await updateCategory(editing.Category_ID, {
          Category_Name: formState.Category_Name.trim(),
        });
        alert("Category updated");
      } else {
        await createCategory({ Category_Name: formState.Category_Name.trim() });
        alert("Category created");
      }
      await load();
      // Reset modal + form state
      setShowModal(false);
      setEditing(null);
      setFormState({ Category_Name: "" });
    } catch (err) {
      console.error("Save Category Error:", err);
      alert("Failed to save category.");
    }
    setLoading(false);
  };


  // ========================================================
  // Deletes a category by ID after user confirmation.
  // ========================================================
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    setLoading(true);
    try {
      await deleteCategory(id);
      alert("Category deleted");
      await load();
    } catch (err) {
      console.error("Delete error", err);
      alert("Failed to delete category.");
    }
    setLoading(false);
  };

  // ======================================================
  // Render UI
  // ======================================================
  return (
    <div className="category-manager">
      <h2 className="panel-title">Category Manager</h2>

      {/* Search + Add Button Row */}
      <div className="search-row">
        <input
          className="search-input"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-gold" onClick={handleSearch}>
          Search
        </button>
        <button className="btn btn-gold add-btn" onClick={openNew}>
          + Add New Category
        </button>
      </div>

      {loading && <div>Loading...</div>}

      {/* Category Table */}
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Category Name</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {paginated.map((c) => (
            <tr key={c.Category_ID}>
              <td>{c.Category_ID}</td>
              <td>{c.Category_Name}</td>
              <td>
                {/* Edit Button */}
                <button className="btn btn-dark" onClick={() => openEdit(c)}>
                  Edit
                </button>{" "}
                {/* Delete Button */}
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(c.Category_ID)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {/* No results after searching */}
          {paginated.length === 0 && !loading && (
            <tr>
              <td colSpan={3} style={{ textAlign: "center", padding: 20 }}>
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
            <h3>{editing ? "Edit Category" : "Add New Category"}</h3>

            {/* Category Name Input */}
            <label>Category Name</label>
            <input
              className="form-input"
              value={formState.Category_Name}
              onChange={(e) =>
                setFormState({ ...formState, Category_Name: e.target.value })
              }
            />

            <div className="modal-buttons">
              <button className="btn btn-gold" onClick={handleSave}>
                {editing ? "Save Changes" : "Create Category"}
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