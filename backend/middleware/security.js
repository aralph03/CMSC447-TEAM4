// ========================================================
// File description: Sets the JWT Secret Key defined in
// the .env file
// ========================================================

// Import required modules
require("dotenv").config();

module.exports = { jwtSecret: process.env.JWT_SECRET };