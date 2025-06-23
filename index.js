const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");

const app = express();
const db = new Database("results.db");

app.use(cors());
app.use(express.json());

// Create table if it doesn't exist
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

// Endpoint to save result
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

// Endpoint to get results
app.get("/api/results", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM results ORDER BY id DESC").all();
    res.json(rows);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Failed to retrieve results" });
  }
});

// ✅ Listen on all interfaces and correct port for Render
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on port ${PORT}`);
});
