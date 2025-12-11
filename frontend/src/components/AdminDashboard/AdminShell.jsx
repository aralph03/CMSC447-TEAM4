// ========================================================
// File description: Combines MainPanel.jsx and Sidebar.jsx
// into one file so both can be accessible throughout
// all Admin Dashboard views
// ========================================================

// Import required modules
import React from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import MainPanel from "./MainPanel";
import "./AdminShell.css";
import header from "../../assets/header.png";

// Displays the header and sidebar on every Admin page
export default function AdminShell() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // Determine which panel to show
  const getView = () => {
    const path = location.pathname;
    if (path.includes("/admin/faqs")) return "faqs";
    if (path.includes("/admin/categories")) return "categories";
    if (path.includes("/admin/forms")) return "forms";
    if (path.includes("/admin/logs")) return "logs";
    if (path.includes("/admin/users")) return "users";
    if (path.includes("/admin/chatbot")) return "chatbot";
    return "dashboard";
  };

  const view = getView();

  // Returns basic styling and text for the shell to be further styled in the .css file
  return (
    <div className="admin-shell">
      <img src={header} alt="Header" className="header-img" />
      <header className="label">
        <h1 className="label-text">CSEE Admin Dashboard</h1>
      </header>
      <div className={`main-content ${sidebarOpen ? "expanded" : "collapsed"}`}>
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <MainPanel view={view} sidebarCollapsed={!sidebarOpen} />
      </div>
    </div>
  );
}