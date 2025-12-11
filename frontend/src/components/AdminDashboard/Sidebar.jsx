// ========================================================
// File description: Create the Sidebar components that
// allows Admin users to switch between home, chatbot, and
// table views
// ========================================================

// Import required modules
import React from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar({ isOpen, toggleSidebar }) {
  const navigate = useNavigate();
  // If Admin selects logout, remove token and redirect to landing page
  const handleLogout = async () => {
    try {
      localStorage.removeItem('jwtToken');
      navigate("/");
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  // Return main structure for the sidebar
  return (
    <div className="sidebar-container">
      {/* Toggle button */}
      <button onClick={toggleSidebar} className="button">
        <div className="icon">
          <span className="first" />
          <span className="second" />
          <span className="third" />
        </div>
      </button>
    
     {/* Overlay */}
      <div onClick={toggleSidebar} className={`overlay ${isOpen ? "show" : ""}`} />

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2>Navigation</h2>
        </div>

        <nav className="sidebar-nav">
          <Link to="/admin" onClick={toggleSidebar}>Home</Link>
          <Link to="/chatbot" onClick={toggleSidebar}>Chatbot</Link>
          <Link to="/admin/categories" onClick={toggleSidebar}>Categories</Link>
          <Link to="/admin/faqs" onClick={toggleSidebar}>FAQs</Link>
          <Link to="/admin/forms" onClick={toggleSidebar}>Forms</Link>
          <Link to="/admin/logs" onClick={toggleSidebar}>Logs</Link>
          <Link to="/admin/users" onClick={toggleSidebar}>Users</Link>
        </nav>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </aside>
    </div>
  );
}
