const express = require("express");
const db = require("../db");
const requireAuth = require("../middleware/requireAuth");
const { levelFromTotalXp } = require("../xp");

const router = express.Router();

router.get("/", requireAuth, (req, res) => {
  const { total } = db
    .prepare("SELECT COALESCE(SUM(xp_earned), 0) AS total FROM runs WHERE user_id = ?")
    .get(req.user.id);
  const { count } = db
    .prepare("SELECT COUNT(*) AS count FROM runs WHERE user_id = ?")
    .get(req.user.id);

  res.json({
    id: req.user.id,
    nickname: req.user.nickname,
    profileImageUrl: req.user.profile_image_url,
    totalRuns: count,
    totalXp: total,
    ...levelFromTotalXp(total),
  });
});

module.exports = router;
