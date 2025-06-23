const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");

const app = express();
const db = new Database("results.db");

app.use(cors());
app.use(express.json());

// Create tables if they don't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER,
    created_at TEXT,
    elapsed INTEGER,
    score INTEGER,
    correct INTEGER,
    incorrect INTEGER,
    missed TEXT
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER,
    visited_at TEXT
  )
`).run();

// Save test result
app.post("/api/results", (req, res) => {
  const { timestamp, elapsed, score, correct, incorrect, missed } = req.body;

  try {
    const createdAt = new Date(timestamp).toISOString().replace("T", " ").split(".")[0];
    const stmt = db.prepare(`
      INSERT INTO results (timestamp, created_at, elapsed, score, correct, incorrect, missed)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(timestamp, createdAt, elapsed, score, correct, incorrect, JSON.stringify(missed));

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Insert error:", err);
    res.status(500).json({ error: "Failed to save result" });
  }
});

// Get all results
app.get("/api/results", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM results ORDER BY id DESC").all();
    res.json(rows);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Failed to retrieve results" });
  }
});

// Log visitor timestamp
app.post("/api/visit", (req, res) => {
  try {
    const timestamp = Date.now();
    const visitedAt = new Date(timestamp).toISOString().replace("T", " ").split(".")[0];
    db.prepare("INSERT INTO visits (timestamp, visited_at) VALUES (?, ?)").run(timestamp, visitedAt);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Visit insert error:", err);
    res.status(500).json({ error: "Failed to log visit" });
  }
});

// (Optional) Get all visits
app.get("/api/visits", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM visits ORDER BY id DESC").all();
    res.json(rows);
  } catch (err) {
    console.error("Fetch visits error:", err);
    res.status(500).json({ error: "Failed to retrieve visits" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on port ${PORT}`);
});
