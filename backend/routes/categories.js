// ========================================================
// File description: Defines CRUD operations for the
// categories table
// ========================================================

// Import required modules
const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { authenticate } = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/roleMiddleware");

// Define a route for GET requests for categories by ID
router.get('/categories/:id', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const catId = req.params.id;
        // Query category by ID
        const result = await connection.query(
            `SELECT *
            FROM Categories
            WHERE Category_ID = ?`,
            [catId]
        );
        res.status(200).json(result);
    // Catch any errors and display error message
    } catch (err) {
        console.error(`Error fetching category:`, err);
        res.status(500).json({ error: `Failed to fetch category` });
    } finally {
        if (connection) connection.release(); // release the connection
    }
});

// Define a route for GET requests for categories
router.get('/categories', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        // Query for all categories
        const result = await connection.query(
            `SELECT *
            FROM Categories`
        );
        res.status(200).json(result);
    // Catch any errors and display error message
    } catch (err) {
        console.error(`Error fetching categories:`, err);
        res.status(500).json({ error: `Failed to fetch categories` });
    } finally {
        if (connection) connection.release(); // release the connection
    }
});

// Define a route for POST requests for categories
router.post('/categories', authenticate, requireAdmin, async (req, res) => {
    let connection;
    try {
        const { Category_Name } = req.body;
        // Input validation
        if (!Category_Name || Category_Name.trim() === "") {
            return res.status(400).json({ error: "Missing or empty name" });
        }
        connection = await db.getConnection();
        // Create new category and set name
        const result = await connection.query(
            `INSERT INTO Categories (Category_Name)
            VALUES (?)`,
            [Category_Name]
        );
        res.status(201).json({ message: "Category created", category: { id: result.insertId.toString(), Category_Name }});
    // Catch any errors and display error message
    } catch (err) {
        console.error(`Error creating category:`, err);
        res.status(500).json({ error: `Failed to create category` });
    } finally {
        if (connection) connection.release(); // release the connection
    }
});

// Define a route for PUT requests for categories
router.put('/categories/:id', authenticate, requireAdmin, async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const catId = req.params.id;
        const { Category_Name } = req.body;
        // Input validation
        if (!Category_Name || Category_Name.trim() === "") {
            return res.status(400).json({ error: "Missing or empty name" });
        }
        // Query by category ID and update with new name
        const result = await connection.query(
            `UPDATE Categories 
            SET Category_Name = ?
            WHERE Category_ID = ?`,
            [Category_Name, catId]
        );
        res.status(200).json({ message: `Category with ID ${catId} updated`, updatedCat: { id: catId, Category_Name }});
    // Catch any errors and display error message
    } catch (err) {
        console.error(`Error updating category:`, err);
        res.status(500).json({ error: `Failed to update category` });
    } finally {
        if (connection) connection.release(); // release the connection
    }
});

// Define a route for DELETE requests for categories
router.delete('/categories/:id', authenticate, requireAdmin, async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const catId = req.params.id;
        // Query by ID and delete category
        const result = await connection.query(
            `DELETE FROM Categories
            WHERE Category_ID = ?`,
            [catId]
        );
        res.status(200).json({ message: `Category deleted` });
    // Catch any errors and display error message
    } catch (err) {
        console.error('Error deleting category:', err);
        res.status(500).json({ error: 'Failed to delete category'});
    } finally {
        if (connection) connection.release(); // release the connection
    }
});

module.exports = router;