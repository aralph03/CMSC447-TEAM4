// ========================================================
// File description: Handles chatbot triage logic: keyword-based FAQ matching (Phase 1)
// and category-driven assistance fallback (Phase 2).
// When chatbot cannot confidently match a query (Phase 1),
// this phase helps users find information by guiding them
// through category-based assistance.
// ========================================================

const express = require("express");
const router = express.Router();
const db = require("../db/db");

// ========================================================
// Keyword-Based Search (Phase 1)
// ========================================================
// GET /triage/search?query=apply+for+graduation
// --------------------------------------------------------
// (Phase 1 - Keyword-Based Search)
// Uses FULLTEXT search on FAQ Question & Answer columns
// Returns top matching FAQs ranked by relevance
// If no match found, chatbot can prompt category fallback
// ========================================================
router.get("/search", async (req, res) => {
  const { query } = req.query;
  if (!query || query.trim() === "") {
    return res.status(400).json({ error: "Missing or empty 'query' parameter" });
  }

  let connection;
  try {
    connection = await db.getConnection();

    // Perform full-text keyword search
    const results = await connection.query(
      `
      SELECT f.FAQ_ID, f.Question, f.Answer, c.Category_Name,
        MATCH(f.Question, f.Answer) AGAINST(? IN NATURAL LANGUAGE MODE) AS relevance
      FROM FAQs f
      INNER JOIN Categories c ON f.FAQ_Category_ID = c.Category_ID
      WHERE MATCH(f.Question, f.Answer) AGAINST(? IN NATURAL LANGUAGE MODE)
      ORDER BY relevance DESC
      LIMIT 10
      `,
      [query, query]
    );

    // If no keyword matches found, trigger Phase 2 (category-driven)
    if (results.length === 0) {
      return res.json({
        message: "No direct keyword matches found. Consider category-driven assistance.",
        results: [],
        nextStep: "category-driven-assistance",
      });
    }

    // Return keyword-ranked results
    res.json({
      query,
      total_results: results.length,
      results,
    });
  // Catch any errors and display error message
  } catch (err) {
    console.error("Error performing keyword search:", err);
    res.status(500).json({ error: "Failed to perform keyword search" });
  } finally {
    if (connection) connection.release();
  }
});

// ========================================================
// STORY 2 – Category-Driven Assistance (Phase 2)
// ========================================================
// GET /triage/categories/:id/faqs
// --------------------------------------------------------
// Once user selects a category, fetch related FAQs
// If too few results, also suggest related categories
// ========================================================
router.get("/categories/:id/faqs", async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();
    const categoryId = req.params.id;

    // Fetch FAQs for the selected category
    const faqs = await connection.query(
      `
      SELECT f.FAQ_ID, f.Question, f.Answer, c.Category_ID, c.Category_Name
      FROM FAQs f
      INNER JOIN Categories c ON f.FAQ_Category_ID = c.Category_ID
      WHERE c.Category_ID = ?
      `,
      [categoryId]
    );

    // If few FAQs found, suggest other related categories
    let relatedCategories = [];
    if (faqs.length < 3) {
      relatedCategories = await connection.query(
        `
        SELECT Category_ID, Category_Name
        FROM Categories
        WHERE Category_ID <> ?
        LIMIT 3
        `,
        [categoryId]
      );
    }

    // Return structured response
    res.json({
      Category_ID: categoryId,
      FAQs: faqs,
      Related_Categories: relatedCategories,
    });
  // Catch any errors and display error message
  } catch (err) {
    console.error("Error fetching FAQs for category:", err);
    res.status(500).json({ error: "Failed to fetch category FAQs" });
  } finally {
    if (connection) connection.release();
  }
});

// ========================================================
// Related Category Suggestions (Phase 2 Support)
// ========================================================
// GET /triage/suggest
// --------------------------------------------------------
// Suggests relevant categories based on keyword search
// Used when chatbot can’t map question confidently
// ========================================================
router.get("/suggest", async (req, res) => {
  const { query } = req.query;
  if (!query || query.trim() === "") {
    return res.status(400).json({ error: "Missing or empty 'query' parameter" });
  }
  let connection;
  try {
    connection = await db.getConnection();    
    const keyword = `%${query}%`;
    let suggestions = [];

    // Find categories whose FAQs contain the keyword
    // Try to find best matching categories using both full-text
    // search (if available) and simple LIKE pattern fallback
    suggestions = await connection.query(
      `
      SELECT DISTINCT c.Category_ID, c.Category_Name
      FROM FAQs f
      INNER JOIN Categories c ON f.FAQ_Category_ID = c.Category_ID
      WHERE MATCH(f.Question, f.Answer) AGAINST(? IN NATURAL LANGUAGE MODE)
      LIMIT 5
      `,
      [query]
    );

    // If no suggestions found, fallback to LIKE search
    // (in future, might base this on Logs table analytics)
    if (suggestions.length === 0) {
      suggestions = await connection.query(
        `
        SELECT Category_ID, Category_Name 
        FROM Categories
        WHERE Category_Name LIKE ?
        LIMIT 5
        `,
        [keyword]
      );
    }
    res.json({
      message: "Suggested categories based on your query",
      user_query: query,
      suggestions,
    });
  // Catch any errors and display error message
  } catch (err) {
    console.error("Error suggesting categories:", err);
    res.status(500).json({ error: "Failed to suggest related categories" });
  } finally {
    if (connection) connection.release();
  }
});

// ========================================================
// No-Match Fallback (Phase 3)
// ========================================================
// POST /triage/query
// --------------------------------------------------------
// Logs the user's query and returns fallback staff contact
// information when no FAQ match was found.
// Also ensures the user exists in the Users table so that
// each chatbot session can be tied to a user identity.
// ========================================================
router.post("/query", async (req, res) => {
  const { userId, queryText, categoryId, fullName, userEmail, userPhone, userRole, userType } = req.body;

  if (!queryText || queryText.trim() === "") {
    return res.status(400).json({ error: "Missing or empty queryText" });
  }

  let connection;
  try {
    connection = await db.getConnection();

    // Step 0: Ensure user exists or create a new one dynamically
    let userIdToUse = userId || null;

    if (!userIdToUse && (fullName || userEmail)) {
      // Check if a user with this email or name already exists
      const existingUsers = await connection.query(
        `SELECT User_ID FROM Users WHERE User_Email = ? OR Full_Name = ? LIMIT 1`,
        [userEmail || null, fullName || null]
      );

      if (existingUsers.length > 0) {
        userIdToUse = existingUsers[0].User_ID;
      } else {
        // Create a new user record
        const result = await connection.query(
          `INSERT INTO Users (Full_Name, User_Email, User_Phone, User_Role, User_Type)
           VALUES (?, ?, ?, ?, ?)`,
          [fullName || "Anonymous", userEmail || null, userPhone || null, userRole || 'User', userType || null]
        );
        userIdToUse = result.insertId;
      }
    }

    // Step 1: Log the user's query first
    const logResult = await connection.query(
      `
      INSERT INTO Logs (User_Log_ID, Category_ID, FAQ_ID, Query, Response, Status)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [userIdToUse, categoryId || null, null, queryText, null, "No answer"] // First insert "No answer" (shows chatbot’s attempt failed) and then update it to "Escalated" after fallback escalation occurs
    );

    // Step 2: Fetch fallback staff contact (most recent Admin)
    const [staffContact] = await connection.query(
      `
      SELECT User_ID, Full_Name, User_Email, User_Phone
      FROM Users
      WHERE User_Role = 'Admin'
      ORDER BY RAND()
      LIMIT 1
      `
    );

    // Step 3: Build chatbot-friendly structured response
    const responseMessage = staffContact
      ? `No matching FAQs were found. Please contact ${staffContact.Full_Name} at ${staffContact.User_Email}.`
      : `No matching FAQs were found. Please contact the CSEE Helpdesk.`;

    const responsePayload = {
      message: responseMessage,
      fallback_contact: staffContact
        ? {
            name: staffContact.Full_Name,
            email: staffContact.User_Email,
            phone: staffContact.User_Phone,
          }
        : {
            name: "CSEE Helpdesk",
            email: "dept@cs.umbc.edu",
            phone: "410-455-3500",
          },
      log_id: logResult.insertId,
      user_id: userIdToUse, // Return the user_id used for this query
    };

    // Step 4: Update the log entry with the chatbot response
    await connection.query(
      `UPDATE Logs SET Response = ?, Status = ? WHERE Log_ID = ?`,
      [responseMessage, "Escalated", logResult.insertId]
    );

    // Step 5: Return structured chatbot response
    res.status(200).json(responsePayload);
  // Catch any errors and display error message
  } catch (err) {
    console.error("Error handling triage fallback:", err);
    res.status(500).json({ error: "Failed to handle fallback query" });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;