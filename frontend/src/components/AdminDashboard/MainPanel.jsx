// ========================================================
// File description: Renders the views for each Admin
// table and the Admin home page
// ========================================================

// Import required modules
import React from "react";

// Manager Components
import FAQManager from "./FAQManager";
import CategoryManager from "./CategoryManager";
import UserManager from "./UserManager";
import FormManager from "./FormManager";
import LogsViewer from "./LogsViewer";

// Unified UMBC theme styles
import "./MainPanel.css";

export default function MainPanel({ view, sidebarCollapsed }) {
  // Decide what to display based on view passed from AdminShell or Sidebar
  const renderPanel = () => {
    switch (view) {
      case "faqs":
        return <FAQManager />;
      case "categories":
        return <CategoryManager />;
      case "users":
        return <UserManager />;
      case "forms":
        return <FormManager />;
      case "logs":
        return <LogsViewer />;
      default:
        return (
          <div className="welcome-panel">
            <h2>Welcome to the UMBC CSEE Admin Dashboard</h2>
            <p>Select an item from the sidebar to begin.</p>
          </div>
        );
    }
  };

  // Renders panel depending on sidebar state
  return (
    <div className={ sidebarCollapsed ? "main-panel-container collapsed" : "main-panel-container" } >
      {renderPanel()}
    </div>
  );
}
