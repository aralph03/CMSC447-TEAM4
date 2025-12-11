// ========================================================
// File description: Provides full CRUD (Create, Read, Update, Delete)
// 
// This component is used by Admin users to manage
// all FAQ entries, including their questions, answers,
// categories, form links, escalation contacts, and target audience.
// ========================================================
import React, { useEffect, useState } from "react";
import { getFAQs, createFAQ, updateFAQ, deleteFAQ, getCategories, getForms, getUsers, 
} from "../../api/api";
import "./MainPanel.css"; // Ensures consistent UMBC theme

export default function FAQManager() {
  // All FAQs loaded from backend
  const [faqs, setFaqs] = useState([]);

  // FAQs after search/filtering
  const [filtered, setFiltered] = useState([]);

  // Search bar input
  const [search, setSearch] = useState("");

  // Available categories for dropdown
  const [categories, setCategories] = useState([]);

  // Available forms for dropdown
  const [forms, setForms] = useState([]);

  // Available users for escalation contact dropdown
  const [users, setUsers] = useState([]);

  // Loading state for API calls
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // Pagination
  // -----------------------------
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // -----------------------------
  // Modal control
  // -----------------------------
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // Stores FAQ being edited

  // -----------------------------
  // Modal form state
  // -----------------------------
  const [formState, setFormState] = useState({
    Question: "",
    Answer: "",
    FAQ_Category_ID: "",
    FAQ_Form_ID: "",
    Escalation_contact_ID: "",
    Target_User_Type: "",
  });

  // ========================================================
  // Fetches FAQs, categories, forms, and users from API
  // ========================================================
  const load = async () => {
    setLoading(true);
    try {
      const [faqRes, catRes, formRes, userRes] = await Promise.all([getFAQs(), getCategories(), getForms(), getUsers(),]);
      setFaqs(faqRes.data);
      setFiltered(faqRes.data);
      setCategories(catRes.data);
      setForms(formRes.data);
      setUsers(userRes.data);
    } catch (err) {
      console.error("Error loading FAQs", err);
      alert("Failed to load FAQ data.");
    }
    setLoading(false);
  };

  // Load data on component mount
  useEffect(() => {
    load();
  }, []);

  // -----------------------------
  // Search functionality
  // -----------------------------
  const handleSearch = () => {
    if (!search.trim()) {
      setFiltered(faqs);
      setPage(1);
      return;
    }
    const q = search.toLowerCase();
    const result = faqs.filter(
      (f) =>
        f.Question.toLowerCase().includes(q) ||
        f.Answer?.toLowerCase().includes(q) ||
        f.Category_Name?.toLowerCase().includes(q)
    );
    setFiltered(result);
    setPage(1); // Reset to first page after search
  };

  // -----------------------------
  // Pagination calculation
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
      Question: "",
      Answer: "",
      FAQ_Category_ID: categories[0]?.Category_ID || "",
      FAQ_Form_ID: "",
      Escalation_contact_ID: "",
      Target_User_Type: "All",
    });
    setShowModal(true);
  };

  // -----------------------------
  // Modal - open for edit
  // -----------------------------
  const openEdit = (faq) => {
    setEditing(faq);
    setFormState({
      Question: faq.Question,
      Answer: faq.Answer,
      FAQ_Category_ID: faq.FAQ_Category_ID,
      FAQ_Form_ID: faq.FAQ_Form_ID || "",
      Escalation_contact_ID: faq.Escalation_contact_ID || "",
      Target_User_Type: faq.Target_User_Type,
    });
    setShowModal(true);
  };

  // -----------------------------
  // Save FAQ (create or update)
  // -----------------------------
  const handleSave = async () => {
    if (!formState.Question || !formState.FAQ_Category_ID) {
      alert("Question and Category are required.");
      return;
    }
    setLoading(true);
    try {
      if (editing) {
        await updateFAQ(editing.FAQ_ID, formState);
        alert("FAQ updated");
      } else {
        await createFAQ(formState);
        alert("FAQ created");
      }
      await load();
      setShowModal(false);
    } catch (err) {
      console.error("Save FAQ error", err);
      alert("Failed to save FAQ.");
    }
    setLoading(false);
  };

  // -----------------------------
  // Delete FAQ
  // -----------------------------
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this FAQ?")) return;
    setLoading(true);
    try {
      await deleteFAQ(id);
      alert("FAQ deleted");
      await load();
    } catch (err) {
      console.error("Delete FAQ error", err);
      alert("Failed to delete FAQ.");
    }
    setLoading(false);
  };

  // ======================================================
  // RENDER UI
  // ======================================================
  return (
    <div>
      <h2 className="panel-title">FAQ Manager</h2>

      {/* Search Row */}
      <div className="search-row">
        <input
          className="search-input"
          placeholder="Search FAQs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-gold" onClick={handleSearch}>
          Search
        </button>
        <button className="btn btn-gold add-btn" onClick={openNew}>
          + Add New FAQ
        </button>
      </div>

      {loading && <div>Loading...</div>}

      {/* FAQ Table */}
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Question</th>
            <th>Category</th>
            <th>Target</th>
            <th>Updated</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {paginated.map((faq) => (
            <tr key={faq.FAQ_ID}>
              <td>{faq.FAQ_ID}</td>
              <td style={{ maxWidth: 350 }}>{faq.Question}</td>
              <td>{faq.Category_Name}</td>
              <td>{faq.Target_User_Type}</td>
              <td>{faq.FAQ_last_updated}</td>
              <td>
                {/* Edit Button */}
                <button className="btn btn-dark" onClick={() => openEdit(faq)}>
                  Edit
                </button>{" "}
                {/* Delete Button */}
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(faq.FAQ_ID)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {/* No results after searching */}
          {paginated.length === 0 && !loading && (
            <tr>
              <td colSpan={6} style={{ textAlign: "center", padding: 20 }}>
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
            <h3>{editing ? "Edit FAQ" : "Add New FAQ"}</h3>

            {/* Question */}
            <label>Question</label>
            <textarea
              className="form-input"
              rows={3}
              value={formState.Question}
              onChange={(e) =>
                setFormState({ ...formState, Question: e.target.value })
              }
            />

            {/* Answer */}
            <label>Answer</label>
            <textarea
              className="form-input"
              rows={4}
              value={formState.Answer}
              onChange={(e) =>
                setFormState({ ...formState, Answer: e.target.value })
              }
            />

            {/* Category */}
            <label>Category</label>
            <select
              className="form-select"
              value={formState.FAQ_Category_ID}
              onChange={(e) =>
                setFormState({
                  ...formState,
                  FAQ_Category_ID: e.target.value,
                })
              }
            >
              {categories.map((c) => (
                <option key={c.Category_ID} value={c.Category_ID}>
                  {c.Category_Name}
                </option>
              ))}
            </select>

            {/* Forms */}
            <label>Form Link (optional)</label>
            <select
              className="form-select"
              value={formState.FAQ_Form_ID}
              onChange={(e) =>
                setFormState({ ...formState, FAQ_Form_ID: e.target.value })
              }
            >
              <option value="">None</option>
              {forms.map((f) => (
                <option key={f.Form_ID} value={f.Form_ID}>
                  {f.Form_Name}
                </option>
              ))}
            </select>

            {/* Escalation */}
            <label>Escalation Contact</label>
            <select
              className="form-select"
              value={formState.Escalation_contact_ID}
              onChange={(e) =>
                setFormState({
                  ...formState,
                  Escalation_contact_ID: e.target.value,
                })
              }
            >
              <option value="">None</option>
              {users.map((u) => (
                <option key={u.User_ID} value={u.User_ID}>
                  {u.Full_Name}
                </option>
              ))}
            </select>

            {/* Target */}
            <label>Target</label>
            <select
              className="form-select"
              value={formState.Target_User_Type}
              onChange={(e) =>
                setFormState({
                  ...formState,
                  Target_User_Type: e.target.value,
                })
              }
            >
              <option value="">--select--</option>
              <option>All</option>
              <option>Undergraduate Student</option>
              <option>Graduate Student</option>
              <option>Faculty</option>
              <option>Prospective Student</option>
              <option>Visitor</option>
              <option>Ph.D. Student</option>
            </select>

            <div className="modal-buttons">
              <button className="btn btn-gold" onClick={handleSave}>
                {editing ? "Save Changes" : "Create FAQ"}
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