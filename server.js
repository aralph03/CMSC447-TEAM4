// ========================================================
// File description: Handles the server connection and
// routes for the Triage system
// ========================================================


// Import required modules
require("dotenv").config({ override: true });
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const port = process.env.PORT || 3060;

// Create server
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

// Import routes
const faqsRouter = require('./routes/faqs');
const categoriesRouter = require('./routes/categories');
const usersRouter = require('./routes/users');
const logsRouter = require('./routes/logs');
const formsRouter = require('./routes/forms');
const authRouter = require('./routes/auth');
const triageRouter = require('./routes/triage');

// Mount routes
app.use('/api',faqsRouter);
app.use('/api',categoriesRouter);
app.use('/api',usersRouter);
app.use('/api',logsRouter);
app.use('/api',formsRouter);
app.use('/auth',authRouter);
app.use('/triage', triageRouter);

// Display the server is running
app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
});