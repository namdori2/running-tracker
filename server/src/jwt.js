const jwt = require("jsonwebtoken");

const SECRET =
  process.env.JWT_SECRET ||
  (() => {
    console.warn(
      "[jwt] JWT_SECRET not set in .env — using an insecure default for local dev only."
    );
    return "dev-only-insecure-secret";
  })();

function signToken(user) {
  return jwt.sign({ sub: user.id, nickname: user.nickname }, SECRET, { expiresIn: "30d" });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET); // throws if invalid/expired
}

module.exports = { signToken, verifyToken };
