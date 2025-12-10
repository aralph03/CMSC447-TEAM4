// ========================================================
// File description: Defines CRUD operations for the
// logs table
// ========================================================

// Import required modules
const express = require('express');
const router = express.Router();
const db = require('../db/db');

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

module.exports = router;