const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'finance_system',
  password: process.env.DB_PASS || 'your_password_here',
  port: process.env.DB_PORT || 5432,
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful!');

    // Test if users table exists
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'users'
      );
    `);

    if (result.rows[0].exists) {
      console.log('✅ Users table exists');
    } else {
      console.log('❌ Users table does not exist');
      console.log('Creating users table...');

      await client.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Users table created successfully');
    }

    client.release();
    await pool.end();

  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.log('\n🔧 To fix this issue:');
    console.log('1. Make sure PostgreSQL is installed and running');
    console.log('2. Update your .env file with correct database credentials');
    console.log('3. Or use the default credentials if PostgreSQL is running with defaults');
    await pool.end();
  }
}

testConnection();
