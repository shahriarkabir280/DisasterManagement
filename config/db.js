require('dotenv').config();
const mysql = require('mysql2');

// Create a connection to the database using environment variables
// IMPORTANT: do NOT commit real credentials. Use a .env file locally and set environment variables in production.
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'disastermanagement',
  // Keep multipleStatements disabled to reduce risk of SQL injection via stacked queries
  multipleStatements: false,
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to MySQL database');
});

module.exports = db;
