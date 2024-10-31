const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const { token } = req.cookies;
  if (!token) return res.status(401).json({ error: "Access denied" });

  jwt.verify(token, "YOUR_SECRET_KEY", (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;
