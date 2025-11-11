// ========================================================
// File description: Defines POST function for Login
// ========================================================


// Import required modules
const express = require('express');
const router = express.Router();
const db = require('../db/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// =========================================================
// POST /auth/login → Authenticate user by username/password
// =========================================================
router.post("/login", async (req, res) => {
  let connection;
  try {
    const { username, password } = req.body;

    // Input validation
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }

    connection = await db.getConnection();

    // Query user by username
    const result = await connection.query(
      `SELECT User_ID, User_Name, User_Email, User_Password, User_Role, User_Type
       FROM Users
       WHERE User_Name = ?`,
      [username]
    );

    // If no result, return error message
    if (result.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const user = result[0];

    // Compare entered password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.User_Password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Generate JWT with essential user info
    const token = jwt.sign(
      {
        User_ID: user.User_ID,
        User_Name: user.User_Name,
        User_Role: user.User_Role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user.User_ID,
        username: user.User_Name,
        role: user.User_Role,
        email: user.User_Email  // for frontend reference or password reset later
      }
    });
  // Catch any errors and display error message
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ error: "Failed to log in." });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;