const bcrypt = require('bcrypt');
const db = require('./db_sqlite');

async function createTestUser() {
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);

    db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      ['testuser', 'test@example.com', hashedPassword],
      function(err) {
        if (err) {
          console.error('❌ Error creating test user:', err.message);
        } else {
          console.log('✅ Test user created successfully!');
          console.log('Email: test@example.com');
          console.log('Password: password123');
          console.log('User ID:', this.lastID);
        }
        db.close();
      }
    );
  } catch (err) {
    console.error('❌ Error:', err.message);
    db.close();
  }
}

createTestUser();
