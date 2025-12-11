// ========================================================
// File description: Establishes all API calls between
// backend and frontend CRUD operations and authentication.
// All forgot password functionality is commented out since
// it was not implemented due to scope of the course.
// ========================================================

import axios from "axios";

const API_BASE = "http://localhost:3060";

// Reusable Axios instance
const api = axios.create({
  baseURL: API_BASE,
});

// Add a request interceptor to include the token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// =======================================================
// AUTH
// =======================================================

export const logIn = (username, password) => api.post("/auth/login", { username, password });

export const logOut = () => api.post("/auth/logout");

/*
// Forgot Password (send reset email)
export const requestPasswordReset = (email) =>
  api.post("/auth/request-reset", { email });

// Validate token before showing password reset screen
export const validateResetToken = (token) =>
  api.get(`/auth/reset/${token}`);

// Submit new password
export const submitNewPassword = (token, newPassword) =>
  api.post(`/auth/reset/${token}`, { newPassword });
*/

// =======================================================
// FAQs CRUD
// =======================================================
export const getFAQs = () => api.get("/api/faqs");

export const createFAQ = (faqData) => api.post("/api/faqs", faqData);

export const updateFAQ = (id, faqData) => api.put(`/api/faqs/${id}`, faqData);

export const deleteFAQ = (id) => api.delete(`/api/faqs/${id}`);

// =======================================================
// Categories CRUD
// =======================================================
export const getCategories = () => api.get("/api/categories");

export const createCategory = (data) => api.post("/api/categories", data);

export const updateCategory = (id, data) => api.put(`/api/categories/${id}`, data);

export const deleteCategory = (id) => api.delete(`/api/categories/${id}`);

// =======================================================
// Users CRUD
// =======================================================
export const getUsers = () => api.get("/api/users");

export const createUser = (data) => api.post("/api/users", data);

export const updateUser = (id, data) => api.put(`/api/users/${id}`, data);

export const deleteUser = (id) => api.delete(`/api/users/${id}`);

// =======================================================
// Forms CRUD
// =======================================================
export const getForms = () => api.get("/api/forms");

export const createForm = (data) => api.post("/api/forms", data);

export const updateForm = (id, data) => api.put(`/api/forms/${id}`, data);

export const deleteForm = (id) => api.delete(`/api/forms/${id}`);

// =======================================================
// Logs (Read-Only)
// =======================================================
export const getLogs = () => api.get("/api/logs");

export default {
  // Auth
  logIn,
  logOut,
  /*
  requestPasswordReset,
  validateResetToken,
  submitNewPassword,
  */

  // FAQs
  getFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,

  // Categories
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,

  // Users
  getUsers,
  createUser,
  updateUser,
  deleteUser,

  // Forms
  getForms,
  createForm,
  updateForm,
  deleteForm,

  // Logs
  getLogs,
};
