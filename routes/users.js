// Import required modules
const express = require('express');
const router = express.Router();
const db = require('../db/db');
const bcrypt = require('bcrypt');
const { authenticate } = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/roleMiddleware");

// Define a route for GET requests for users by ID
router.get('/users/:id', authenticate, requireAdmin, async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const userId = req.params.id;
        // Query by User ID
        const result = await connection.query(
            `SELECT *
            FROM Users
            WHERE User_ID = ?`,
            [userId]
        );
        res.status(200).json(result);
    // Catch any errors and display error message
    } catch (err) {
        console.error(`Error fetching user:`, err);
        res.status(500).json({ error: `Failed to fetch user` });
    } finally {
        if (connection) connection.release(); // release the connection
    }
});

// Define a route for GET requests for users
router.get('/users', authenticate, requireAdmin, async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        // Query all users
        const result = await connection.query(
            `SELECT *
            FROM Users`
        );
        res.status(200).json(result);
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
        const { name, username, email, phone, password, token, expires, role, type } = req.body;
        // Input validation
        if (!name || name.trim() == "" || !username || username.trim() == "" || !email || email.trim() == "") {
            return res.status(400).json({ error: "Missing or empty request" });
        }
        connection = await db.getConnection();
        // Input relevant information and create user
        const result = await connection.query(
            `INSERT INTO Users (Full_Name, User_Name, User_Email, User_Phone, User_Password, Password_Reset_Token, Password_Reset_Expires, User_Role, User_Type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, username, email, phone, password, token, expires, role, type]
        );
        res.status(201).json({ message: "User created", user: { id: result.insertId.toString(), name, username, email, phone, password, token, expires, role, type }});
    // Catch any errors and display error message
    } catch (err) {
        console.error(`Error creating user:`, err);
        res.status(500).json({ error: `Failed to create user` });
    } finally {
        if (connection) connection.release(); // release the connection
    }
});

// Define a route for PUT requests for users
router.put("/users/:id", authenticate, async (req, res) => {
  let connection;
  try {
    const userId = req.params.id;
    const { name, username, email, phone, password, token, expires, role, type } = req.body;
    // Input validation
    if (!name || name.trim() == "" || !username || username.trim() == "" || !email || email.trim() == "") {
        return res.status(400).json({ error: "Missing or empty request" });
    }
    connection = await db.getConnection();
    // Only hash the password if it's provided (avoid overwriting existing hash)
    let hashedPassword = null;
    if (password) {
      const saltRounds = 12;
      hashedPassword = await bcrypt.hash(password, saltRounds);
    }
    // Query by log ID and update information
    const result = await connection.query(
      `UPDATE Users
       SET Full_Name = ?, User_Name = ?, User_Email = ?, User_Phone = ?, User_Password = COALESCE(?, User_Password), Password_Reset_Token = ?, Password_Reset_Expires = ?, User_Role = ?, User_Type = ?
       WHERE User_ID = ?`,
      [name, username, email, phone, hashedPassword, token, expires, role, type, userId]
    );
    // MariaDB returns info on affected rows, not updated data
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: `User ID ${userId} not found` });
    }
    res.status(200).json({
      message: `User with ID ${userId} updated successfully`,
      updatedUser: { id: userId, name, username, email, phone, role, type }});
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
        const userId = req.params.id;
        // Query by User ID and delete user
        const result = await connection.query(
            `DELETE FROM Users
            WHERE User_ID = ?`,
            [userId]
        );
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