require("dotenv").config();

const express = require("express");
const cors = require("cors");
const authRouter = require("./routes/auth");
const meRouter = require("./routes/me");
const runsRouter = require("./routes/runs");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "5mb" })); // GPS 포인트 배열이 커질 수 있어 여유있게 설정

app.get("/health", (req, res) => res.json({ ok: true }));
app.use("/auth", authRouter);
app.use("/api/me", meRouter);
app.use("/api/runs", runsRouter);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Run tracker server listening on http://0.0.0.0:${PORT}`);
});
