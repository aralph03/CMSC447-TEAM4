// ========================================================
// File description: Establishes all API calls for the
// three triage phases
// ========================================================

import axios from "axios";

const API_BASE = "http://localhost:3060";

// Axios Instance
const triageAPI = axios.create({
  baseURL: API_BASE,
});

// ---------------------------------------------------------
// Phase 1 – Keyword-Based Search
// GET /triage/search?query=
// ---------------------------------------------------------
export const searchFAQs = async (query, userId) => {
  return triageAPI.get("/triage/search", {
    params: { query, userId },
  });
};

// ---------------------------------------------------------
// Phase 2 – Suggest Categories
// GET /triage/suggest?query=
// ---------------------------------------------------------
export const suggestCategories = async (query) => {
  return triageAPI.get("/triage/suggest", {
    params: { query },
  });
};

// ---------------------------------------------------------
// Phase 2 – Fetch FAQs by Category
// GET /triage/categories/:id/faqs
// ---------------------------------------------------------
export const getCategoryFAQs = async (categoryId, query, userId) => {
  return triageAPI.get(`/triage/categories/${categoryId}/faqs`, {
    params: { query, userId },
  });
};

// ---------------------------------------------------------
// Phase 3 – Escalation Fallback
// POST /triage/query
// ---------------------------------------------------------
export const escalateQuery = async ({ 
  queryText,
  categoryId = null,
  fullName,
  userEmail,
  userPhone,
  userId,            
  userRole,       
  userType, 
}) => {
  return triageAPI.post("/triage/query", { 
    queryText,
    categoryId,
    fullName,
    userEmail,
    userPhone,
    userId,
    userRole,
    userType,
  });
};

export default {
  searchFAQs,
  suggestCategories,
  getCategoryFAQs,
  escalateQuery,
};