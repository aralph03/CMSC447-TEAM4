// ========================================================
// File description: Creates the Landing Page layout
// and components
// ========================================================

// Import required modules
import React from "react";
import { Link } from "react-router-dom";
import "./Landing.css";

export default function LandingPage() {
  return (
    <div className="landing-container">
      
      {/* Top Banner */}
      <div className="landing-banner" />

      {/* Center Content */}
      <div className="landing-content">
        <h1>Welcome to CSEE Virtual Help Desk!</h1>

        {/* Landing buttons */}
        <div className="landing-buttons">
          <Link to="/register" className="landing-btn">Non-Admin/User</Link>
          <Link to="/login" className="landing-btn">Admin Login</Link>
        </div>
      </div>
    </div>
  );
}
