// ========================================================
// File description: Defines CRUD operations for the
// users table
// ========================================================

// Import required modules
const express = require('express');
const router = express.Router();
const db = require('../db/db');
const bcrypt = require('bcrypt');
const { authenticate } = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/roleMiddleware");

// Safe fields to return to frontend
const PUBLIC_FIELDS = `
  User_ID, Full_Name, User_Name, User_Email, User_Phone,
  User_Role, User_Type
`;

// Define a route for GET requests for users
router.get('/users', authenticate, requireAdmin, async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        // Query all users
        const result = await connection.query(`SELECT ${PUBLIC_FIELDS} FROM Users`);
        res.status(200).json(result);
    // Catch any errors and display error message
    } catch (err) {
        console.error(`Error fetching user:`, err);
        res.status(500).json({ error: `Failed to fetch user` });
    } finally {
        if (connection) connection.release(); // release the connection
    }
});

// Define a route for GET requests for users by ID
router.get('/users/:id', authenticate, requireAdmin, async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const User_ID = req.params.id;
        // Query by User ID
        const result = await connection.query(
          `SELECT ${PUBLIC_FIELDS} FROM Users WHERE User_ID = ?`,
          [User_ID]
        );
        if (!result || result.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json(result[0]);
    // Catch any errors and display error message
    } catch (err) {
        console.error(`Error fetching user:`, err);
        res.status(500).json({ error: `Failed to fetch user` });
    } finally {
        if (connection) connection.release(); // release the connection
    }
});

// Define a route for POST requests for users
router.post('/users', authenticate, requireAdmin, async (req, res) => {
    let connection;
    try {
        const { Full_Name, User_Name, User_Email, User_Phone, User_Password, User_Role, User_Type } = req.body;
        // Input validation
        if (!Full_Name || !User_Email) {
          return res.status(400).json({ error: "Full name and email are required." });
        }
        // Admins must have both username & password
        if (User_Role === "Admin") {
          if (!User_Name || !User_Password) {
            return res.status(400).json({ error: "Admin accounts must have a username and password." });
          }
        }
        // Non-admins username allowed to be NULL
        const finalUsername = (User_Role === "Admin") ? User_Name : null;
        connection = await db.getConnection();
        let hashedPassword = null;
        const saltRounds = 12;
    	  if (User_Password && User_Password.trim() !== "") {
          if (User_Password.length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters." });
          }
          hashedPassword = await bcrypt.hash(User_Password, saltRounds);
        }
        // Input relevant information and create user
        const result = await connection.query(
            `INSERT INTO Users (Full_Name, User_Name, User_Email, User_Phone, User_Password, User_Role, User_Type)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [Full_Name, finalUsername, User_Email, User_Phone || null, hashedPassword, User_Role || "User", User_Type || null]
        );
        res.status(201).json({ message: "User created successfully.", user: { User_ID: result.insertId.toString(), Full_Name, User_Name: finalUsername, User_Email, User_Phone, User_Role, User_Type }});
    // Catch any errors and display error message
    } catch (err) {
        console.error(`Error creating user:`, err);
        res.status(500).json({ error: `Failed to create user` });
    } finally {
        if (connection) connection.release(); // release the connection
    }
});

// Define a route for PUT requests for users
router.put('/users/:id', authenticate, requireAdmin, async (req, res) => {
  let connection;
  try {
    const User_ID = req.params.id;
    const { Full_Name, User_Name, User_Email, User_Phone, User_Password, User_Role, User_Type } = req.body;
    // Input validation
    if (!Full_Name || !User_Email) {
      return res.status(400).json({ error: "Full name and email are required." });
    }
    // Non-admins username allowed to be NULL
    const finalUsername = User_Role === "Admin" ? User_Name : null;
    connection = await db.getConnection();
    // Only hash the password if it's provided (avoid overwriting existing hash)
    let hashedPassword = null;
    const saltRounds = 12;
    if (User_Password && User_Password.trim() !== "") {
      if (User_Password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters." });
      }
      hashedPassword = await bcrypt.hash(User_Password, saltRounds);
    }
    // Query by user ID and update information
    const result = await connection.query(
      `UPDATE Users
       SET Full_Name = ?, User_Name = ?, User_Email = ?, User_Phone = ?, User_Password = COALESCE(?, User_Password), User_Role = ?, User_Type = ?
       WHERE User_ID = ?`,
      [Full_Name, finalUsername, User_Email, User_Phone || null, hashedPassword, User_Role || "User", User_Type || null, User_ID]
    );
    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ error: `User_ID ${User_ID} not found` });
    }
    res.status(200).json({
      message: `User with ID ${User_ID} updated successfully`,
      updatedUser: { id: User_ID, Full_Name, User_Name: finalUsername, User_Email, User_Phone, User_Role: User_Role || "User", User_Type: User_Type || null }});
    // Catch any errors and display error message
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Failed to update user" });
  } finally {
    if (connection) connection.release();
  }
});

// Define a route for DELETE requests for users
router.delete('/users/:id', authenticate, requireAdmin, async (req, res) => {
    let connection;
    try {
      connection = await db.getConnection();
      const User_ID = req.params.id;
      // Query by User ID and delete user
      const result = await connection.query(
        `DELETE FROM Users WHERE User_ID = ?`,
        [User_ID]
      );
      if (!result || result.affectedRows === 0) {
        return res.status(404).json({ error: `User_ID ${User_ID} not found` });
      }
      res.status(200).json({ message: `User deleted` });
    // Catch any errors and display error message
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: 'Failed to delete user'});
    } finally {
        if (connection) connection.release(); // release the connection
    }
});

module.exports = router;