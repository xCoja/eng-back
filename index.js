const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");

const app = express();
const db = new Database("results.db");

// Middlewares
app.use(cors());
app.use(express.json());

// Health check route
app.get("/", (req, res) => {
  res.send("✅ Backend is up and running!");
});

// Create table if not exists
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

// POST route to save result
app.post("/api/results", (req, res) => {
  const { timestamp, elapsed, score, correct, incorrect, missed } = req.body;

  try {
    const stmt = db.prepare(`
      INSERT INTO results (timestamp, elapsed, score, correct, incorrect, missed)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(timestamp, elapsed, score, correct, incorrect, JSON.stringify(missed));

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Insert error:", err);
    res.status(500).json({ error: "Failed to save result" });
  }
});

// GET route to retrieve results
app.get("/api/results", (req, res) => {
  try {
    const results = db.prepare("SELECT * FROM results ORDER BY id DESC").all();
    res.json(results);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Failed to retrieve results" });
  }
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ API running on port ${PORT}`);
});
