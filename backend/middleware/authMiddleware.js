// ========================================================
// File description: Handles authentication between
// JWT and the current Admin user. Used in tandem
// with the roleMiddleware function requireAdmin().
// ========================================================

// Import required modules 
const express = require('express');
const jwt = require('jsonwebtoken');
require("dotenv").config();

// Authenticates an Admin token
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  // Input validation
  if (!authHeader) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }
  const token = authHeader.split(" ")[1];
  // Verify the token
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid or expired token.' });
  }
}

module.exports = { authenticate };