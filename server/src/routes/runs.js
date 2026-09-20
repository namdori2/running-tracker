const express = require("express");
const db = require("../db");
const requireAuth = require("../middleware/requireAuth");
const { xpForRun, DAILY_QUEST_BONUS_XP } = require("../xp");

const router = express.Router();
router.use(requireAuth);

function rowToRun(row) {
  return {
    id: row.id,
    startedAt: row.started_at,
    durationSec: row.duration_sec,
    distanceMeters: row.distance_meters,
    points: JSON.parse(row.points),
    xpEarned: row.xp_earned,
    createdAt: row.created_at,
  };
}

// 목록은 좌표 배열(points) 없이 가볍게 반환
router.get("/", (req, res) => {
  const rows = db
    .prepare(
      "SELECT id, started_at, duration_sec, distance_meters, xp_earned, created_at FROM runs WHERE user_id = ? ORDER BY started_at DESC"
    )
    .all(req.user.id);
  res.json(
    rows.map((row) => ({
      id: row.id,
      startedAt: row.started_at,
      durationSec: row.duration_sec,
      distanceMeters: row.distance_meters,
      xpEarned: row.xp_earned,
      createdAt: row.created_at,
    }))
  );
});

router.get("/:id", (req, res) => {
  const row = db
    .prepare("SELECT * FROM runs WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: "not found" });
  res.json(rowToRun(row));
});

router.post("/", (req, res) => {
  const { startedAt, durationSec, distanceMeters, points } = req.body || {};

  if (
    typeof startedAt !== "string" ||
    !Number.isFinite(durationSec) ||
    !Number.isFinite(distanceMeters) ||
    !Array.isArray(points)
  ) {
    return res.status(400).json({ error: "invalid run payload" });
  }

  const startedAtDate = startedAt.slice(0, 10); // YYYY-MM-DD
  const { count: runsToday } = db
    .prepare(
      "SELECT COUNT(*) AS count FROM runs WHERE user_id = ? AND substr(started_at, 1, 10) = ?"
    )
    .get(req.user.id, startedAtDate);
  const isFirstRunToday = runsToday === 0;

  const xpEarned =
    xpForRun({ distanceMeters, durationSec }) + (isFirstRunToday ? DAILY_QUEST_BONUS_XP : 0);

  const info = db
    .prepare(
      "INSERT INTO runs (user_id, started_at, duration_sec, distance_meters, points, xp_earned) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(
      req.user.id,
      startedAt,
      Math.round(durationSec),
      Math.round(distanceMeters),
      JSON.stringify(points),
      xpEarned
    );

  const row = db.prepare("SELECT * FROM runs WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json({ ...rowToRun(row), dailyQuestCompleted: isFirstRunToday });
});

router.delete("/:id", (req, res) => {
  const info = db
    .prepare("DELETE FROM runs WHERE id = ? AND user_id = ?")
    .run(req.params.id, req.user.id);
  if (info.changes === 0) return res.status(404).json({ error: "not found" });
  res.status(204).end();
});

module.exports = router;
