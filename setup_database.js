const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'postgres', // Connect to default postgres database first
  password: process.env.DB_PASS || 'your_password_here',
  port: process.env.DB_PORT || 5432,
});

async function setupDatabase() {
  try {
    // Create the finance_system database if it doesn't exist
    await pool.query('CREATE DATABASE IF NOT EXISTS finance_system');
    console.log('✅ Database created or already exists');

    // Switch to the finance_system database
    const appPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: 'finance_system',
      password: process.env.DB_PASS || 'your_password_here',
      port: process.env.DB_PORT || 5432,
    });

    // Create users table
    await appPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created or already exists');

    await appPool.end();
    await pool.end();
    console.log('✅ Database setup completed successfully!');

  } catch (err) {
    console.error('❌ Error setting up database:', err.message);
    await pool.end();
  }
}

setupDatabase();
