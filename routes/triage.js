// ========================================================
// File description: Handles chatbot triage logic:
// keyword-based FAQ matching (Phase 1), category-driven
// assistance fallback (Phase 2), and staff escalation
// (Phase 3). When chatbot cannot confidently match a
// query (Phase 1), Phase 2 helps users find information
// by guiding them through category-based assistance. If
// neither are sufficient enough for user satisfaction,
// they are provided a staff contact in Phase 3.
// ========================================================

// Import required modules
const express = require("express");
const router = express.Router();
const db = require("../db/db");

// POST /triage/register
// Register a normal (non-admin) user before chatbot interaction
router.post("/register", async (req, res) => {
  const { Full_Name, User_Email, User_Phone, User_Type } = req.body;
  // Basic validation
  if (!Full_Name || !User_Email) {
    return res.status(400).json({ error: "Full_Name and User_Email are required." });
  }
  let connection;
  try {
    connection = await db.getConnection();
    // First, check if user with this email already exists
    const existing = await connection.query(
      "SELECT User_ID, Full_Name, User_Email, User_Phone, User_Role, User_Type FROM Users WHERE User_Email = ?",
      [User_Email]
    );
    if (existing.length > 0) {
      // User already exists, so return their data (lookup behavior)
      return res.status(200).json({ user: existing[0], message: "User already registered" });
    }
    // Insert user (User_Name NULL, Password NULL, Role = User)
    const result = await connection.query(
      `
      INSERT INTO Users 
      (Full_Name, User_Name, User_Email, User_Phone, User_Role, User_Type)
      VALUES (?, NULL, ?, ?, ?, ?)
      `,
      [Full_Name, User_Email, User_Phone || null, "User", User_Type || null]
    );
    const newUser = {
      User_ID: result.insertId.toString(),
      Full_Name,
      User_Email,
      User_Phone: User_Phone || null,
      User_Type: User_Type || null,
      User_Role: "User"
    };
    res.status(201).json({
      message: "User registered successfully",
      user: newUser
    });
    // Check any errors and display error message
  } catch (err) {
    console.error("Error registering user:", err);
    // Handle duplicate email edge case
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "Email already exists. Use a different email."
      });
    }
    res.status(500).json({ error: "Failed to register user" });
  } finally {
    if (connection) connection.release(); // release connection
  }
});

// ========================================================
// Keyword-Based Search (Phase 1)
// ========================================================
// GET /triage/search
// (Phase 1 - Keyword-Based Search)
// Uses full-text search on FAQ Question & Answer columns
// Returns top matching FAQs ranked by relevance
// If no match found, chatbot can prompt category fallback
// ========================================================
router.get("/search", async (req, res) => {
  const { query, userId } = req.query;
  // Input validation
  if (!query || query.trim() === "") {
    return res.status(400).json({ error: "Missing or empty 'query' parameter" });
  }
  if (!userId) {
    return res.status(400).json({ error: "Missing userId for logging" });
  }
  let connection;
  try {
    connection = await db.getConnection();
    // Perform full-text keyword search
    const results = await connection.query(
      `
      SELECT f.FAQ_ID, f.Question, f.Answer, f.FAQ_Category_ID, c.Category_Name,
        MATCH(f.Question, f.Answer) AGAINST(? IN NATURAL LANGUAGE MODE) AS relevance
      FROM FAQs f
      INNER JOIN Categories c ON f.FAQ_Category_ID = c.Category_ID
      WHERE MATCH(f.Question, f.Answer) AGAINST(? IN NATURAL LANGUAGE MODE)
      ORDER BY relevance DESC
      LIMIT 10
      `,
      [query, query]
    );
    // Phase 1 Logging: Log the top match (if any) for analytics
    if (results.length > 0) {
      const bestMatch = results[0];
      await connection.query(
        `
        INSERT INTO Logs (User_Log_ID, Category_ID, FAQ_ID, Query, Response, Status)
        VALUES (?, ?, ?, ?, ?, 'ANSWERED_PHASE1')
        `,
        [
          userId,
          bestMatch.FAQ_Category_ID,
          bestMatch.FAQ_ID,
          query,
          bestMatch.Answer
        ]
      );
    } else {
      // No match, so log as no answer (Phase 2 coming next)
      await connection.query(
        `
        INSERT INTO Logs (User_Log_ID, Category_ID, FAQ_ID, Query, Response, Status)
        VALUES (?, NULL, NULL, ?, NULL, 'FAILED_PHASE1')
        `,
        [userId, query]
      );
    }
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
    if (connection) connection.release(); // release connection
  }
});

// ========================================================
// Related Category Suggestions (Phase 2 Support)
// ========================================================
// GET /triage/suggest
// Suggests relevant categories based on keyword search
// Used when chatbot can’t map question confidently
// ========================================================
router.get("/suggest", async (req, res) => {
  const { query } = req.query;
  // Input validation
  if (!query || query.trim() === "") {
    return res.status(400).json({ error: "Missing or empty 'query' parameter" });
  }
  let connection;
  try {
    connection = await db.getConnection();    
    let suggestions = [];
    // Find categories whose FAQs contain the keyword
    // Try to find best matching categories using both full-text
    // search and simple like pattern fallback
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
    // If no suggestions found, fallback to like search
    if (suggestions.length === 0) {
      const keyword = `%${query}%`;
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
    // If still no suggestions, fallback to returning all categories (force Phase 2)
    if (suggestions.length === 0) {
      const allCategories = await connection.query(
        `SELECT Category_ID, Category_Name FROM Categories`
      );
      return res.json({
        message: "No keyword-based suggestions — returning full category list",
        user_query: query,
        categories: allCategories,
      });
    } else {
      // Normal suggestion flow
      return res.json({
        message: "Suggested categories based on your query",
        user_query: query,
        categories: suggestions,
      });
    }
    // Catch any errors and display error message
  } catch (err) {
    console.error("Error suggesting categories:", err);
    res.status(500).json({ error: "Failed to suggest related categories" });
  } finally {
    if (connection) connection.release(); // release connection
  }
});

// ========================================================
// Category-Driven Assistance (Phase 2)
// ========================================================
// GET /triage/categories/:id/faqs
// Once user selects a category, fetch related FAQs
// If too few results, also suggest related categories
// ========================================================
router.get("/categories/:id/faqs", async (req, res) => {
  const { id: categoryId } = req.params;
  const { query, userId } = req.query;
  // Input validation
  if (!query || !userId) {
    return res.status(400).json({
      error: "Both 'query' and 'userId' parameters are required."
    });
  }
  let connection;
  try {
    connection = await db.getConnection();
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
    // Phase 2 Logging: Log the category selection and FAQs shown
    if (faqs.length > 0) {
      // Log first FAQ as the main answer
      const bestFaq = faqs[0];
      await connection.query(
        `
        INSERT INTO Logs (User_Log_ID, Category_ID, FAQ_ID, Query, Response, Status)
        VALUES (?, ?, ?, ?, ?, 'ANSWERED_PHASE2')
        `,
        [
          userId,
          categoryId,
          bestFaq.FAQ_ID,
          query,
          bestFaq.Answer
        ]
      );
    } else {
      // No FAQ inside category
      await connection.query(
        `
        INSERT INTO Logs (User_Log_ID, Category_ID, FAQ_ID, Query, Response, Status)
        VALUES (?, ?, NULL, ?, NULL, 'FAILED_PHASE2')
        `,
        [userId, categoryId, query]
      );
    }
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
    if (connection) connection.release(); // release connection
  }
});

// ========================================================
// No-Match Fallback (Phase 3)
// ========================================================
// POST /triage/query
// Logs the user's query and returns fallback staff contact
// information when no FAQ match was found.
// Also ensures the user exists in the Users table so that
// each chatbot session can be tied to a user identity.
// ========================================================
router.post("/query", async (req, res) => {
  const { userId, queryText, categoryId, fullName, userEmail, userPhone, userRole, userType } = req.body;
  // Input validation
  if (!queryText || queryText.trim() === "") {
    return res.status(400).json({ error: "Missing or empty queryText" });
  }
  if (!userId && (!fullName || !userEmail)) {
    return res.status(400).json({ error: "Either userId or both fullName and userEmail must be provided" });
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
        [userEmail, fullName]
      );
      if (existingUsers.length > 0) {
        userIdToUse = existingUsers[0].User_ID.toString();
      } else {
        // Create a new user record
        const result = await connection.query(
          `INSERT INTO Users (Full_Name, User_Email, User_Phone, User_Password, User_Role, User_Type)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [fullName, userEmail, userPhone || null, null, userRole || 'User', userType || null]
        );
        userIdToUse = result.insertId.toString();
      }
    }
    // Step 1: Log the user's query first
    const logResult = await connection.query(
      `
      INSERT INTO Logs (User_Log_ID, Category_ID, FAQ_ID, Query, Response, Status)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [userIdToUse, categoryId || null, null, queryText, null, "NO_ANSWER"] // First insert "No answer" (shows chatbot’s attempt failed) and then update it to "Escalated" after fallback escalation occurs
    );
    // Step 2: Fetch fallback staff contact (Random so one staff member will not handle all questions)
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
            Full_Name: staffContact.Full_Name,
            User_Email: staffContact.User_Email,
            User_Phone: staffContact.User_Phone,
          }
        : {
            Full_Name: "CSEE Helpdesk",
            User_Email: "dept@cs.umbc.edu",
            User_Phone: "410-455-3500",
          },
      log_id: logResult.insertId.toString(),
      user_id: userIdToUse.toString(), // Return the user_id used for this query
    };
    // Step 4: Update the log entry with the chatbot response
    await connection.query(
      `UPDATE Logs SET Response = ?, Status = ? WHERE Log_ID = ?`,
      [responseMessage, "ESCALATED", logResult.insertId]
    );
    // Step 5: Return structured chatbot response
    res.status(200).json(responsePayload);
    // Catch any errors and display error message
  } catch (err) {
    console.error("Error handling triage fallback:", err);
    res.status(500).json({ error: "Failed to handle fallback query" });
  } finally {
    if (connection) connection.release(); // release connection
  }
});

module.exports = router;