// ========================================================
// File description: Connects backend to MariaDB
// ========================================================


// connect to MariaDB
require("dotenv").config({ override: true });
const mariadb = require("mariadb");

// create connection pool
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  connectionLimit: 5,
  bigIntAsString: false,
});

module.exports = pool;