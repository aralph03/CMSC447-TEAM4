// ========================================================
// File description: Defines CRUD operations for the
// forms table
// ========================================================

// Import required modules
const express = require('express');
const router = express.Router();
const db = require('../db/db');
const {authenticate} = require('../middleware/authMiddleware');
const {requireAdmin} = require('../middleware/roleMiddleware');

// Define a route for GET requests for forms by ID
router.get('/forms/:id', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const formId = req.params.id;
        // Query form by ID
        const result = await connection.query(
            `SELECT *
            FROM Forms
            WHERE Form_ID = ?`,
            [formId]
        );
        res.status(200).json(result);
    // Catch any errors and display error message
    } catch (err) {
        console.error(`Error fetching form:`, err);
        res.status(500).json({ error: `Failed to fetch form` });
    } finally {
        if (connection) connection.release(); // release the connection
    }
});

// Define a route for GET requests for forms
router.get('/forms', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        // Query all forms
        const result = await connection.query(
            `SELECT *
            FROM Forms`
        );
        res.status(200).json(result);
    // Catch any errors and display error message
    } catch (err) {
        console.error(`Error fetching forms:`, err);
        res.status(500).json({ error: `Failed to fetch forms` });
    } finally {
        if (connection) connection.release(); // release the connection
    }
});

// Define a route for POST requests for forms
router.post('/forms', authenticate, requireAdmin, async (req, res) => {
    let connection;
    try {
        const { name, url, requirement, contact, type } = req.body;
        // Input validation
        if (!name || name.trim() === "" || !url || url.trim() == "") {
            return res.status(400).json({ error: "Missing or empty question, answer, or category" });
        }
        connection = await db.getConnection();
        // Insert relevant information and create form
        const result = await connection.query(
            `INSERT INTO Forms (Form_Name, Form_URL, requires_staff, staff_contact_id, Form_Target_User_Type)
            VALUES (?, ?, ?, ?, ?)`,
            [name, url, requirement, contact, type]
        );
        res.status(201).json({ message: "Form created", user: { id: result.insertId.toString(), name, url, requirement, contact, type }});
    // Catch any errors and display error message
    } catch (err) {
        console.error(`Error creating form:`, err);
        res.status(500).json({ error: `Failed to create form` });
    } finally {
        if (connection) connection.release(); // release the connection
    }
});

// Define a route for PUT requests for forms
router.put('/forms/:id', authenticate, requireAdmin, async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const formId = req.params.id;
        const { name, url, requirement, contact, type, updated } = req.body;
        // Input validation
        if (!name || name.trim() === "" || !url || url.trim() == "") {
            return res.status(400).json({ error: "Missing or empty question, answer, or category" });
        }
        // Query by Form ID and update information
        const result = await connection.query(
            `UPDATE Forms
            SET Form_Name = ?, Form_URL = ?, requires_staff = ?, staff_contact_id = ?, Form_Target_User_Type = ?, Form_last_updated = ?
            WHERE Form_ID = ?`,
            [name, url, requirement, contact, type, updated, formId]
        );
        res.status(200).json({ message: `Form with ID ${formId} updated`, updatedForm: { id: formId, name, url, requirement, contact, type, updated }});
    // Catch any errors and display error message
    } catch (err) {
        console.error(`Error updating form:`, err);
        res.status(500).json({ error: `Failed to update form` });
    } finally {
        if (connection) connection.release(); // release the connection
    }
});

// Define a route for DELETE requests for forms
router.delete('/forms/:id', authenticate, requireAdmin, async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const formId = req.params.id;
        // Query by Form ID and delete the form
        const result = await connection.query(
            `DELETE FROM Forms
            WHERE Form_ID = ?`,
            [formId]
        );
        res.status(200).json({ message: `Form deleted` });
    // Catch any errors and display error message
    } catch (err) {
        console.error('Error deleting form:', err);
        res.status(500).json({ error: 'Failed to delete form'});
    } finally {
        if (connection) connection.release(); // release the connection
    }
});

module.exports = router;