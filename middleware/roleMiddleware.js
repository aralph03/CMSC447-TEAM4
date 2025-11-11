// ========================================================
// File description: Checks if user is Admin
// ========================================================

// Ensures current user is an Admin
function requireAdmin(req, res, next) {
  if (!req.user || req.user.User_Role !== "Admin") {
    return res.status(403).json({ error: "Admin privileges required." });
  }
  next();
}

module.exports = { requireAdmin };