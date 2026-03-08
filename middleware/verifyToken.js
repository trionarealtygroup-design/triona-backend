const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  try {
    // 1. Header se token uthao
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Authorization header missing" });
    }

    // 2. "Bearer TOKEN" format check
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    // 3. Token verify
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "trionaSecret"
    );

    // 4. User info request me attach
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error("Token error:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = verifyToken;
