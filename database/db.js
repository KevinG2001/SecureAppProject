const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const logger = require("../util/logger");

const db = new sqlite3.Database(
  path.join(__dirname, "database.sqlite"),
  (err) => {
    if (err) {
      logger.error(`Database connection error: ${err.message}`);
    } else {
      logger.info("Connected to SQLite database");
    }
  }
);

// Users Table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    )
  `);
});

// Posts Table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

module.exports = db;
