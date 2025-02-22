const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Define the path for the database file
const dbPath = path.resolve(__dirname, '../mydb.db');

// Open the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Database opened successfully');
  }
});

// Create users and files tables if they don't exist
const createTables = () => {
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    )`,
    (err) => {
      if (err) {
        console.error('Error creating users table:', err);
      } else {
        console.log('Users table created or already exists');
      }
    }
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS files (
      fileid TEXT PRIMARY KEY,
      userid INTEGER,
      FOREIGN KEY(userid) REFERENCES users(id)
    )`,
    (err) => {
      if (err) {
        console.error('Error creating files table:', err);
      } else {
        console.log('Files table created or already exists');
      }
    }
  );
};

// Example: Insert a user into the database
const insertUser = (email, passwordHash) => {
    const stmt = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)');
    stmt.run(email, passwordHash, (err) => {
      if (err) {
        console.error('Error inserting user:', err);
      } else {
        console.log('User inserted successfully');
      }
    });
  };

// Example: Get user ID from email
const getUserId = (email) => {
    return new Promise((resolve, reject) => {
      // Use parameterized query to prevent SQL injection
      const stmt = db.prepare();
      
      db.run(`SELECT id FROM users WHERE email = ${email}`, (err) => {
        console.log(rows);
      });
      // Execute the query and handle the result
    //   stmt.get(email, (err, row) => {
    //     if (err) {
    //       reject('Error retrieving user:', err); // Reject the promise on error
    //     } else {
    //         console.log(row, email);
    //       // If a row is found, return the user ID, otherwise return null
    //       resolve(row ? row.id : null);
    //     }
    //   });
    });
  };
  
  
  // Example: Insert a file linked to a user
  const insertFile = (fileid, userid) => {
    const stmt = db.prepare('INSERT INTO files (fileid, userid) VALUES (?, ?)');
    stmt.run(fileid, userid, (err) => {
      if (err) {
        console.error('Error inserting file:', err);
      } else {
        console.log('File inserted successfully');
      }
    });
  };

// Export database instance and helper functions
module.exports = {
  db,
  createTables,
  insertUser,
  getUserId,
  insertFile
};
