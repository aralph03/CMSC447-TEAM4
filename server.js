// Import required modules
const express=require('express');
const app=express();
const bodyParser=require('body-parser');
const port=process.env.PORT || 3000;
const mariadb=require('mariadb');
const db=require("./db/db")

// Create server
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
});

// Implement operations

// Define a route for GET requests with optional category filter
app.get('/faqs', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const { category } = req.query;
        let rows;
        // If category is not NULL, filter by category
        if (category) {
            rows = await connection.query(
                `SELECT *
                FROM FAQs faqs
                INNER JOIN Categories cat ON faqs.FAQ_Category_ID = cat.Category_ID
                WHERE cat.Category_Name = ?`, [category]
            );
        // If category is NULL, return all FAQs
        } else {
            rows = await connection.query(
                `SELECT *
                FROM FAQs faqs`
            );
        }
        res.json(rows);
    } catch (err) {
        console.error('Error fetching faqs:', err);
        res.status(500).json({ error: 'Failed to fetch faqs' });
    } finally {
        if (connection) connection.release(); // release the connection
    }
});

// Define a route for POST requests for faqs
app.post('/faqs', async (req, res) => {
    // only admins can create FAQs
    if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: "Sorry, only Admins can perform this action." });
    }
    let connection;
    try {
        const { question, answer, category, form, contact, user_type, last_update } = req.body;
        connection = await db.getConnection();
        const result = await connection.query(
            "INSERT INTO FAQs (Question, Answer, FAQ_Category_ID, FAQ_Form_ID, Escalation_contact_ID, Target_User_Type, FAQ_last_updated) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [question, answer, category, form, contact, user_type, last_update]
        );
        res.status(201).json({ message: "FAQ created", faq: { id: result.insertId, question, answer, category, form, contact, user_type, last_update: new Date() }
        });
    } catch (err) {
        console.error("Error creating FAQ:", err);
        res.status(500).json({ error: "Failed to create FAQ" });
    } finally {
        if (connection) connection.release();
    }
});

// Define a route for PUT requests
app.put('/faqs/:id', (req, res) => {
    const faqId = req.params.id;
    const updatedFaq = req.body;
    res.json({ message: 'FAQ with ID ${faqID} updated', updatedFaq });
});

// Define a route for DELETE requests
app.delete('/faqs/:id', async (req, res) => {
    // only admins can delete FAQs
    if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: "Sorry, only Admins can perform this action." });
    }
    let connection;
    try {
        connection = await db.getConnection();
        const faqId = req.params.id;
        const result = await connection.query(
            'DELETE FROM faqs WHERE id = ?', [faqId]
        );
        res.json({ message: `FAQ with ID ${faqId} deleted` });
    } catch (err) {
        console.error('Error deleting FAQ:', err);
        res.status(500).json({ error: 'Failed to delete FAQ'});
    } finally {
        if (connection) connection.release(); // release the connection
    }
});

// Define a route for POST requests for user queries
app.post('/query', async (req, res) => {
    let connection;
    try {
        const { question, answer } = req.body;
        connection = await db.getConnection();
        const result = await connection.query(
            "INSERT INTO faqs (question, answer) VALUES (?, ?)",
            [question, answer]
        );
        res.status(201).json({ message: "FAQ created", faq: { id: result.insertId, question, answer }
        });
    } catch (err) {
        console.error("Error creating FAQ:", err);
        res.status(500).json({ error: "Failed to create FAQ" });
    } finally {
        if (connection) connection.release();
    }
});