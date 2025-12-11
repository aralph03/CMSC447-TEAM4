// ========================================================
// File description: Establishes all API calls for
// non-admin user registration before using the chatbot
// ========================================================

import axios from "axios";

const API_URL = "http://localhost:3060";

// Register a new user (DB will auto-generate User_ID)
export async function registerUser(userData) {
  const response = await axios.post(`${API_URL}/triage/register`, userData);
  return response.data;
}

// Fetch user
export async function getUser(userId) {
  const response = await axios.get(`${API_URL}/triage/${userId}`);
  return response.data;
}

// Search DB for user with existing email
export async function lookupUserByEmail(email) {
  const response = await axios.post(`${API_URL}/auth/lookup`, { User_Email: email });
  return response.data;
}