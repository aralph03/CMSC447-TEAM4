// ========================================================
// File description: Handles authentication between
// JWT and the current Admin user. Used in tandem
// with the roleMiddleware function requireAdmin().
// ========================================================


// Import required modules 
const express = require('express');
const router = express.Router();
const db = require('../db/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require("dotenv").config();

// authenticates the current JWT token
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  // Input validation
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided." });
  }

  const token = authHeader.split(" ")[1];
  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    // Attach user payload from token to request object
    req.user = user;
    next();
  });
}

module.exports = { authenticate };