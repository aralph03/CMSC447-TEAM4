// Import required modules
const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { authenticate } = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/roleMiddleware");

// Define a route for GET requests for logs by ID
router.get('/logs/:id', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        logId = req.params.id;
        // Query logs by ID
        const result = await connection.query(
            `SELECT *
            FROM Logs
            WHERE Log_ID = ?`,
            [logId]
        );
        res.status(200).json(result);
    // Catch any errors and display error message
    } catch (err) {
        console.error(`Error fetching logs:`, err);
        res.status(500).json({ error: `Failed to fetch logs` });
    } finally {
        if (connection) connection.release(); // release the connection
    }
});

// Define a route for GET requests for logs
router.get('/logs', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        // Query all logs
        const result = await connection.query(
            `SELECT *
            FROM Logs`
        );
        res.status(200).json(result);
    // Catch any errors and display error message
    } catch (err) {
        console.error(`Error fetching logs:`, err);
        res.status(500).json({ error: `Failed to fetch logs` });
    } finally {
        if (connection) connection.release(); // release the connection
    }
});

// Define a route for POST requests for logs
router.post('/logs', async (req, res) => {
    let connection;
    try {
        const { user, category, faq, query, response, status } = req.body;
        // Input validation
        if (!query || query.trim() === "") {
            return res.status(400).json({ error: "Missing or empty question, answer, or category" });
        }
        connection = await db.getConnection();
        // Insert relevant information and create log
        const result = await connection.query(
            `INSERT INTO Logs (User_Log_ID, Category_ID, FAQ_ID, Query, Response, Status)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [user, category, faq, query, response, status]
        );
        res.status(200).json({ message: "Log created", user: { id: result.insertId.toString(), user, category, faq, query, response, status }});
    // Catch any errors and display error message
    } catch (err) {
        console.error(`Error creating log:`, err);
        res.status(500).json({ error: `Failed to create log` });
    } finally {
        if (connection) connection.release(); // release the connection
    }
});

// Define a route for PUT requests for logs
router.put('/logs/:id', authenticate, requireAdmin, async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const logId = req.params.id;
        const { user, category, faq, query, response, status } = req.body;
        // Input validation
        if (!query || query.trim() === "") {
            return res.status(400).json({ error: "Missing or empty question, answer, or category" });
        }
        // Query by log ID and update information
        const result = await connection.query(
            `UPDATE Logs
            SET User_Log_ID = ?, Category_ID = ?, FAQ_ID = ?, Query = ?, Response = ?, Status = ?
            WHERE Log_ID = ?`,
            [user, category, faq, query, response, status, logId]
        );
        res.status(200).json({ message: `Log with ID ${logId} updated`, updatedLog: { id: logId, user, category, faq, query, response, status }});
    // Catch any errors and display error message
    } catch (err) {
        console.error(`Error updating log:`, err);
        res.status(500).json({ error: `Failed to update log` });
    } finally {
        if (connection) connection.release(); // release the connection
    }
});

// Define a route for DELETE requests for logs
router.delete('/logs/:id', authenticate, requireAdmin, async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const logId = req.params.id;
        // Query by log ID and delete log
        const result = await connection.query(
            `DELETE FROM Logs
            WHERE Log_ID = ?`,
            [logId]
        );
        res.status(200).json({ message: `Log deleted` });
    // Catch any errors and display error message
    } catch (err) {
        console.error('Error deleting log:', err);
        res.status(500).json({ error: 'Failed to delete log'});
    } finally {
        if (connection) connection.release(); // release the connection
    }
});

module.exports = router;