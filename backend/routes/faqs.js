// ========================================================
// File description: Defines CRUD operations for the
// FAQs table
// ========================================================

// Import required modules
const express = require('express');
const router = express.Router();
const db = require('../db/db');
const {authenticate} = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// Define a route for GET requests with optional category filter
router.get('/faqs', authenticate, requireAdmin, async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const { Category_Name } = req.query;
        let result;
        // If category is not NULL, filter by category
        if (Category_Name) {
            result = await connection.query(
                `SELECT *
                FROM FAQs
                INNER JOIN Categories ON FAQs.FAQ_Category_ID = Categories.Category_ID
                WHERE Categories.Category_Name = ?`,
                [Category_Name]
            );
        // If category is NULL, return all FAQs
        } else {
            result = await connection.query(
                `SELECT *
                FROM FAQs`
            );
        }
        res.status(200).json(result);
    // Catch any errors and display error message
    } catch (err) {
        console.error('Error fetching faqs:', err);
        res.status(500).json({ error: 'Failed to fetch faqs' });
    } finally {
        if (connection) connection.release(); // release the connection
    }
});

// Define a route for POST requests for faqs
router.post('/faqs', authenticate, requireAdmin, async (req, res) => {
    let connection;
    try {
        const { Question, Answer, FAQ_Category_ID, FAQ_Form_ID, Escalation_contact_ID, Target_User_Type } = req.body;
        // Input validation
        if (!Question || Question.trim() === "" || !Answer || Answer.trim() == "") {
            return res.status(400).json({ error: "Missing or empty question, answer, or category" });
        }
        connection = await db.getConnection();
        // Insert relevant information and create FAQ
        const result = await connection.query(
            `INSERT INTO FAQs (Question, Answer, FAQ_Category_ID, FAQ_Form_ID, Escalation_contact_ID, Target_User_Type, FAQ_last_updated)
            VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [Question, Answer, FAQ_Category_ID, FAQ_Form_ID || null, Escalation_contact_ID || null, Target_User_Type || null]
        );
        res.status(201).json({ message: "FAQ created", faq: { id: result.insertId.toString(), Question, Answer, FAQ_Category_ID, FAQ_Form_ID, Escalation_contact_ID, Target_User_Type }});
    // Catch any errors and display error message
    } catch (err) {
        console.error("Error creating FAQ:", err);
        res.status(500).json({ error: "Failed to create FAQ" });
    } finally {
        if (connection) connection.release();
    }
});

// Define a route for PUT requests for faqs
router.put('/faqs/:id', authenticate, requireAdmin, async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const faqId = req.params.id;
        const { Question, Answer, FAQ_Category_ID, FAQ_Form_ID, Escalation_contact_ID, Target_User_Type } = req.body;
        // Input validation
        if (!Question || Question.trim() === "" || !Answer || Answer.trim() == "") {
            return res.status(400).json({ error: "Missing or empty question, answer, or category" });
        }
        // Query by FAQ ID and update information
        const result = await connection.query(
            `UPDATE FAQs 
            SET Question = ?, Answer = ?, FAQ_Category_ID = ?, FAQ_Form_ID = ?, Escalation_contact_ID = ?, Target_User_Type = ?
            WHERE FAQ_ID = ?`,
            [Question, Answer,FAQ_Category_ID, FAQ_Form_ID || null, Escalation_contact_ID || null, Target_User_Type, faqId]
        );
        res.status(200).json({ message: `FAQ with ID ${faqId} updated`, updatedFaq: { faqId, Question, Answer, FAQ_Category_ID, FAQ_Form_ID, Escalation_contact_ID, Target_User_Type }});
    // Catch any errors and display error message
    } catch (err) {
        console.error(`Error updating FAQ:`, err);
        res.status(500).json({ error: `Failed to update FAQ` });
    } finally {
        if (connection) connection.release(); // release the connection
    }
});

// Define a route for DELETE requests for faqs
router.delete('/faqs/:id', authenticate, requireAdmin, async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const faqId = req.params.id;
        // Query by FAQ ID and delete FAQ
        const result = await connection.query(
            `DELETE FROM FAQs
            WHERE FAQ_ID = ?`,
            [faqId]
        );
        res.status(200).json({ message: `FAQ deleted` });
    // Catch any errors and display error message
    } catch (err) {
        console.error('Error deleting FAQ:', err);
        res.status(500).json({ error: 'Failed to delete FAQ'});
    } finally {
        if (connection) connection.release(); // release the connection
    }
});

module.exports = router;