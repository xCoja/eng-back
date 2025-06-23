const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");

const app = express();
app.use(cors());
app.use(express.json());

// setup SQLite
const db = new Database("results.db");
db.prepare(`
  CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER,
    elapsed INTEGER,
    score INTEGER,
    correct INTEGER,
    incorrect INTEGER,
    missed TEXT
  )
`).run();

// API endpoint to receive test results
app.post("/api/results", (req, res) => {
  const { timestamp, elapsed, score, correct, incorrect, missed } = req.body;
  db.prepare(`INSERT INTO results (timestamp, elapsed, score, correct, incorrect, missed)
              VALUES (?, ?, ?, ?, ?, ?)`)
    .run(timestamp, elapsed, score, correct, incorrect, JSON.stringify(missed));
  res.json({ status: "ok" });
});

// Optional: view all results
app.get("/api/results", (req, res) => {
  const results = db.prepare(`SELECT * FROM results ORDER BY id DESC`).all();
  res.json(results);
});

app.listen(8080, () => {
  console.log("API running on http://localhost:8080");
});
