const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const fs = require('fs');

// Ensure database file exists
const dbFile = './magazine.db';
const db = new sqlite3.Database(dbFile);

db.serialize(() => {
    // Create Users/Admins Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        is_admin INTEGER DEFAULT 0
    )`);

    // Create Magazines Table
  // Inside database.js - Updated Table Schema
db.run(`CREATE TABLE IF NOT EXISTS magazines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    category TEXT,
    cover TEXT,
    pdf_path TEXT,
    date TEXT,
    readingTime TEXT,
    rating REAL,
    description TEXT,
    tags TEXT,
    is_discover INTEGER DEFAULT 1  -- 1 for Yes, 0 for No
)`);

    // Create Default Admin (admin / admin123)
    db.get("SELECT * FROM users WHERE username = 'admin'", (err, row) => {
        if (!row) {
            const hash = bcrypt.hashSync('admin123', 10);
            db.run("INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)", 
                ['admin', hash, 1]);
            console.log("Default admin account created: admin / admin123");
        }
    });
});

module.exports = db;