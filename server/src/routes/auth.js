const express = require("express");
const db = require("../db");
const kakao = require("../auth/kakao");
const { signToken } = require("../jwt");

const router = express.Router();

const PROVIDERS = { kakao };

function upsertUser({ provider, providerUserId, nickname, profileImageUrl }) {
  const existing = db
    .prepare("SELECT * FROM users WHERE provider = ? AND provider_user_id = ?")
    .get(provider, providerUserId);
  if (existing) return existing;

  const info = db
    .prepare(
      "INSERT INTO users (provider, provider_user_id, nickname, profile_image_url) VALUES (?, ?, ?, ?)"
    )
    .run(provider, providerUserId, nickname, profileImageUrl);
  return db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
}

// 앱이 브라우저를 여는 진입점. session은 앱이 만든 UUID (폴링 키로 사용)
router.get("/:provider/start", (req, res) => {
  const provider = PROVIDERS[req.params.provider];
  const { session } = req.query;
  if (!provider) return res.status(404).send("unknown provider");
  if (!session) return res.status(400).send("missing session");

  db.prepare("INSERT OR IGNORE INTO login_sessions (id) VALUES (?)").run(session);
  res.redirect(provider.getAuthorizeUrl(session));
});

// OAuth 제공자가 리다이렉트해오는 콜백
router.get("/:provider/callback", async (req, res) => {
  const provider = PROVIDERS[req.params.provider];
  const { code, state: session, error } = req.query;
  if (!provider) return res.status(404).send("unknown provider");

  if (error || !code || !session) {
    if (session) {
      db.prepare("UPDATE login_sessions SET status = 'error' WHERE id = ?").run(session);
    }
    return res.status(400).send("로그인에 실패했습니다. 앱으로 돌아가 다시 시도해주세요.");
  }

  try {
    const { access_token } = await provider.exchangeCodeForToken(code);
    const profile = await provider.fetchProfile(access_token);
    const user = upsertUser({ provider: req.params.provider, ...profile });
    const token = signToken(user);

    db.prepare(
      "UPDATE login_sessions SET status = 'done', token = ?, user_id = ? WHERE id = ?"
    ).run(token, user.id, session);

    res.send(`
      <html><body style="font-family:sans-serif;text-align:center;padding-top:80px;">
        <h2>로그인 완료 ✅</h2>
        <p>${profile.nickname}님, 앱으로 돌아가주세요.</p>
      </body></html>
    `);
  } catch (e) {
    db.prepare("UPDATE login_sessions SET status = 'error' WHERE id = ?").run(session);
    res.status(500).send(`로그인 처리 중 오류가 발생했습니다: ${e.message}`);
  }
});

// 앱이 폴링해서 로그인 완료 여부를 확인
router.get("/session/:sessionId", (req, res) => {
  const row = db
    .prepare("SELECT * FROM login_sessions WHERE id = ?")
    .get(req.params.sessionId);
  if (!row) return res.status(404).json({ status: "not_found" });

  if (row.status !== "done") {
    return res.json({ status: row.status });
  }

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(row.user_id);
  res.json({
    status: "done",
    token: row.token,
    user: {
      id: user.id,
      nickname: user.nickname,
      profileImageUrl: user.profile_image_url,
    },
  });
});

module.exports = router;
