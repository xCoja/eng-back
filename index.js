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
    timestamp TEXT,
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
    timestamp TEXT,
    ip TEXT
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT,
    question TEXT,
    correctAnswer TEXT,
    userAnswer TEXT,
    isCorrect INTEGER
  )
`).run();

// Save full test result
app.post("/api/results", (req, res) => {
  const { timestamp, elapsed, score, correct, incorrect, missed } = req.body;

  try {
    db.prepare(`
      INSERT INTO results (timestamp, elapsed, score, correct, incorrect, missed)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      new Date(timestamp).toLocaleString("sr-RS"),
      elapsed,
      score,
      correct,
      incorrect,
      JSON.stringify(missed)
    );

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Insert error:", err);
    res.status(500).json({ error: "Failed to save result" });
  }
});

// Log visit with IP and time
app.post("/api/visit", (req, res) => {
  try {
    const timestamp = new Date().toLocaleString("sr-RS");
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    db.prepare("INSERT INTO visits (timestamp, ip) VALUES (?, ?)").run(timestamp, ip);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Visit insert error:", err);
    res.status(500).json({ error: "Failed to log visit" });
  }
});

// Save answer per question (from "Proveri")
app.post("/api/answer", (req, res) => {
  const { question, correctAnswer, userAnswer, isCorrect } = req.body;

  try {
    db.prepare(`
      INSERT INTO answers (timestamp, question, correctAnswer, userAnswer, isCorrect)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      new Date().toLocaleString("sr-RS"),
      question,
      correctAnswer,
      userAnswer,
      isCorrect ? 1 : 0
    );

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Answer insert error:", err);
    res.status(500).json({ error: "Failed to log answer" });
  }
});

// Get results
app.get("/api/results", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM results ORDER BY id DESC").all();
    res.json(rows);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Failed to retrieve results" });
  }
});

// Get visits
app.get("/api/visits", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM visits ORDER BY id DESC").all();
    res.json(rows);
  } catch (err) {
    console.error("Visits fetch error:", err);
    res.status(500).json({ error: "Failed to retrieve visits" });
  }
});

// ✅ NEW: Get answers
app.get("/api/answers", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM answers ORDER BY id DESC").all();
    res.json(rows);
  } catch (err) {
    console.error("Answers fetch error:", err);
    res.status(500).json({ error: "Failed to retrieve answers" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on port ${PORT}`);
});
