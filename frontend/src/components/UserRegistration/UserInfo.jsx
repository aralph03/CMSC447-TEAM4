// ========================================================
// File description: Creates the user registration page
// that is required for users to fill out before
// interacting with the chatbot
// ========================================================

// Import required modules
import React, { useState } from "react";
import { registerUser } from "../../api/userAPI";
import "./UserInfo.css";
import { useNavigate } from "react-router-dom";

export default function UserInfoForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    Full_Name: "",
    User_Email: "",
    User_Type: "",
    User_Phone: "",
    User_Role: "User",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const createdUser = await registerUser(formData);

      if (createdUser.message === "User already registered" || createdUser.userAlreadyExists) {
        console.warn("User with that email already exists — logging in instead.");
      }

      // Save user locally for chatbot
      localStorage.setItem("triageUser", JSON.stringify(createdUser.user));

      // Navigate to chatbot
      navigate("/chatbot");
    } catch (err) {
      if (err.response && err.response.status === 409) {
        // Duplicate-entry conflict from backend
        setError("This email is already registered — try logging in.");
      } else {
        console.error(err);
        setError("Failed to register. Please try again.");
    }
    } finally {
      setLoading(false);
    }
  }

  // Returns main structure for the registration page
  return (
    <div className="registration-page">
    <div className="user-info-wrapper">
      <h1 className="main-title">Welcome to UMBC CSEE Virtual Triage Assistant!</h1>
      <p className="main-subtitle">Before we begin, please enter your info.</p>

      <form className="user-info-form" onSubmit={handleSubmit}>
        
        <label>Full Name *</label>
        <input
          type="text"
          name="Full_Name"
          value={formData.Full_Name}
          onChange={handleChange}
          required
        />

        <label>Email *</label>
        <input
          type="email"
          name="User_Email"
          value={formData.User_Email}
          onChange={handleChange}
          required
        />

        <label>User Type *</label>
        <select
          name="User_Type"
          value={formData.User_Type}
          onChange={handleChange}
        >
          <option value="">Select User Type</option>
          <option>Undergraduate Student</option>
          <option>Graduate Student</option>
          <option>Faculty</option>
          <option>Prospective Student</option>
          <option>Ph.D. Student</option>
          <option>Visitor</option>
        </select>

        <label>Phone (optional)</label>
        <input
          type="text"
          name="User_Phone"
          value={formData.User_Phone}
          onChange={handleChange}
        />

        <button className="umbc-gold-button" type="submit" disabled={loading}>
          {loading ? "Registering..." : "Start Chat"}
        </button>

        {error && <p className="error-text">{error}</p>}
      </form>
    </div>
    </div>
  );
}