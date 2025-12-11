// ========================================================
// File description: Creates the LogIn page and components
// for admin users to login to the admin dashboard
// ========================================================

// Import required modules
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logIn } from "../../api/api";
import './LogIn.css'

export default function LogIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await logIn(username, password);
      const token = response.data.token;

      // Decode JWT
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userRole = payload.User_Role;

      // Save token and authentication state locally
      localStorage.setItem("authToken", token);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("role", userRole);

      // Redirect to admin dashboard
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return(
    <div className="login-wrapper">
      {/* Inputs */}
      <form onSubmit={handleLogin}>
        <h1>Virtual Help Desk Admin Login</h1>
        <label>
          <p>Username *</p>
          <input type="text" onChange={e => setUsername(e.target.value)} />
        </label>
        <label>
          <p>Password *</p>
          <input type="password" onChange={e => setPassword(e.target.value)} />
        </label>
        <div>
          <button type="submit">Submit</button>
        </div>
        {/* Forgot Password Link - Commented out since this functionality was outside scope of project
        <div className="forgot-password">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("/forgot-password");
            }}
          >
            Forgot your password?
          </a>
        </div> */}
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  )
}