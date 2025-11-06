const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'finance_system',
  password: process.env.DB_PASS || 'your_password_here',
  port: process.env.DB_PORT || 5432,
});

async function createTestUser() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Insert test user
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      ['testuser', 'test@example.com', hashedPassword]
    );

    console.log('✅ Test user created successfully!');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    console.log('User ID:', result.rows[0].id);

  } catch (err) {
    console.error('❌ Error creating test user:', err.message);
  } finally {
    await pool.end();
  }
}

createTestUser();
