// ========================================================
// File description: Defines POST function for Login, Logout,
// and Password reset requests
// All functions related to Password reset are commented out.
// The functionality was too ambitious for a school project
// and required permissions within Gmail that we did not
// have the ability to change within the scope of the
// project.
// ========================================================

// Import required modules
const express = require('express');
const router = express.Router();
const db = require('../db/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require("crypto");
// const { sendResetEmail } = require("./mailer");

// POST /auth/lookup 
// If a user is already registered, log them into the chatbot
router.post('/lookup', async (req, res) => {
  const { User_Email } = req.body;
  // Input validation
  if (!User_Email) {
    return res.status(400).json({ error: "Email is required" });
  }
  let connection;
  try {
    connection = await db.getConnection();
    // Query user by user email
    const [user] = await connection.query(
      `SELECT User_ID, Full_Name, User_Email, User_Phone, User_Role, User_Type
       FROM Users WHERE User_Email = ?`,
      [User_Email]
    );
    // If no result, return error message
    if (!user) {
      return res.status(404).json({ error: "No user found with that email" });
    }
    // Return user data to frontend
    res.json({ user });
  // Catch any errors and display error message
  } catch (err) {
    console.error("Lookup user error:", err);
    res.status(500).json({ error: "Server error during lookup" });
  } finally {
    if (connection) connection.release(); // release connection
  }
});

// POST /auth/login
// Logs in an Admin user with username/password
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
        email: user.User_Email
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

// POST /auth/logout
// Logs out the user by telling the frontend to discard its JWT token.
router.post("/logout", async (req, res) => {
  try {
    // Logout is handled by frontend, not the backend server
    return res.status(200).json({
      message: "Logout successful. Please remove your JWT token on the client side.",
    });
  } catch (err) {
    console.error("Error during logout:", err);
    return res.status(500).json({ error: "Failed to logout" });
  }
});

// POST /auth/request-reset
// Generates the reset token
/* router.post("/request-reset", async (req, res) => {
  let connection;
  try {
    const { email } = req.body;
    // Input validation
    if (!email) return res.status(400).json({ error: "Email is required." });
    connection = await db.getConnection();
    const result = await connection.query(
      `SELECT User_ID, User_Email FROM Users WHERE User_Email = ?`,
      [email]
    );
    // If no result, return error message
    if (result.length === 0) {
      return res.status(404).json({ error: "No user found with that email." });
    }
    const user = result[0];
    // Create secure token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour
    await connection.query(
      `UPDATE Users
       SET Password_Reset_Token = ?, Password_Reset_Expires = ?
       WHERE User_ID = ?`,
      [hashedToken, expiresAt, user.User_ID]
    );
    // Email link
    const resetURL = `http://localhost:3000/reset-password/${resetToken}`;
    // Send the email
    await sendResetEmail({
      to: user.User_Email,
      resetURL,
      name: user.User_Name
    });
    return res.status(200).json({
      message: "Password reset link generated.",
      resetURL // return for debugging; frontend uses an email handler later
    });
  // Catch any errors and display error message
  } catch (err) {
    console.error("Error requesting reset:", err);
    res.status(500).json({ error: "Failed to generate reset link." });
  } finally {
    if (connection) connection.release();
  }
});


// GET /auth/reset/:token
// Validates the reset token
router.get("/reset/:token", async (req, res) => {
  let connection;
  try {
    const { token } = req.params;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    connection = await db.getConnection();
    // Query user based on reset token
    const result = await connection.query(
      `SELECT User_ID
       FROM Users
       WHERE Password_Reset_Token = ?
         AND Password_Reset_Expires > NOW()`,
      [hashedToken]
    );
    // If no result, return error message
    if (result.length === 0) {
      return res.status(400).json({ error: "Invalid or expired token." });
    }
    return res.status(200).json({ valid: true });
  // Catch any errors and display error message
  } catch (err) {
    console.error("Error validating token:", err);
    res.status(500).json({ error: "Failed to validate reset token." });
  } finally {
    if (connection) connection.release();
  }
});

// POST /auth/reset/:token
// Saves the new updated password
router.post("/reset/:token", async (req, res) => {
  let connection;
  try {
    const { token } = req.params;
    const { password } = req.body;
    // Input validation
    if (!password) {
      return res.status(400).json({ error: "Password is required." });
    }
    if (password.length < 8)
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    connection = await db.getConnection();
    // Query user based on reset token
    const result = await connection.query(
      `SELECT User_ID
       FROM Users
       WHERE Password_Reset_Token = ?
         AND Password_Reset_Expires > NOW()`,
      [hashedToken]
    );

    // If no result, return error message
    if (result.length === 0) {
      return res.status(400).json({ error: "Invalid or expired token." });
    }

    const userId = result[0].User_ID;

    let hashedPassword = null;
    const saltRounds = 12;
    hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Updates password
    await connection.query(
      `UPDATE Users
       SET User_Password = ?, Password_Reset_Token = NULL, Password_Reset_Expires = NULL
       WHERE User_ID = ?`,
      [hashedPassword, userId]
    );

    return res.status(200).json({ message: "Password updated successfully." });

  // Catch any errors and display error message
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ error: "Failed to reset password." });
  } finally {
    if (connection) connection.release();
  }
});
*/

module.exports = router;