const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");

const app = express();
const db  = new Database("results.db");

app.use(cors());
app.use(express.json());

// --------------------  Tabele  --------------------
db.prepare(`
  CREATE TABLE IF NOT EXISTS results (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp     INTEGER,
    elapsed       INTEGER,
    score         INTEGER,
    correct       INTEGER,
    incorrect     INTEGER,
    missed        TEXT
  );
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS visits (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp   INTEGER,
    visited_at  TEXT,
    ip_address  TEXT
  );
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS answers (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp       INTEGER,
    time_formatted  TEXT,
    question        TEXT,
    correct_answer  TEXT,
    user_answer     TEXT,
    is_correct      INTEGER
  );
`).run();

// --------------------  /api/results  --------------------
app.post("/api/results", (req, res) => {
  const { timestamp, elapsed, score, correct, incorrect, missed } = req.body;

  try {
    db.prepare(`
      INSERT INTO results (timestamp, elapsed, score, correct, incorrect, missed)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(timestamp, elapsed, score, correct, incorrect, JSON.stringify(missed));
    res.json({ success: true });
  } catch (err) {
    console.error("Insert results error:", err);
    res.status(500).json({ error: "Failed to save result" });
  }
});

app.get("/api/results", (_req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM results ORDER BY id DESC").all();
    res.json(rows);
  } catch (err) {
    console.error("Fetch results error:", err);
    res.status(500).json({ error: "Failed to retrieve results" });
  }
});

// --------------------  /api/visit  --------------------
app.post("/api/visit", (req, res) => {
  try {
    const timestamp  = Date.now();
    const visited_at = new Date(timestamp).toISOString().replace("T", " ").split(".")[0];
    const ip         = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

    db.prepare(`
      INSERT INTO visits (timestamp, visited_at, ip_address)
      VALUES (?, ?, ?)
    `).run(timestamp, visited_at, ip);

    res.json({ success: true });
  } catch (err) {
    console.error("Visit insert error:", err);
    res.status(500).json({ error: "Failed to log visit" });
  }
});

app.get("/api/visits", (_req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM visits ORDER BY id DESC").all();
    res.json(rows);
  } catch (err) {
    console.error("Fetch visits error:", err);
    res.status(500).json({ error: "Failed to retrieve visits" });
  }
});

// --------------------  /api/answer  --------------------
app.post("/api/answer", (req, res) => {
  const { question, correctAnswer, userAnswer, isCorrect } = req.body;

  try {
    const timestamp      = Date.now();
    const time_formatted = new Date(timestamp).toISOString().replace("T", " ").split(".")[0];

    db.prepare(`
      INSERT INTO answers (timestamp, time_formatted, question, correct_answer, user_answer, is_correct)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      timestamp,
      time_formatted,
      question,
      correctAnswer,
      userAnswer,
      isCorrect ? 1 : 0
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Answer insert error:", err);
    res.status(500).json({ error: "Failed to log answer" });
  }
});

app.get("/api/answers", (_req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM answers ORDER BY id DESC").all();
    res.json(rows);
  } catch (err) {
    console.error("Fetch answers error:", err);
    res.status(500).json({ error: "Failed to retrieve answers" });
  }
});

// --------------------  start  --------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on port ${PORT}`);
});
