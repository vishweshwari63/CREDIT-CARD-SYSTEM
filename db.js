// db.js
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'finance_system',
  password: process.env.DB_PASS || 'your_password_here',
  port: process.env.DB_PORT || 5432,
});

module.exports = pool;
