const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization) {
      if (req.headers.authorization.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
      } else {
        token = req.headers.authorization;
      }
    }

    if (!token) {
      return res.status(401).json({
        message: "Not authenticated"
      });
    }

    const secret = process.env.JWT_SECRET || process.env.JWT || "default_jwt_secret";

    const decoded = jwt.verify(
      token,
      secret
    );

    req.user = decoded;

    next();

  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};

module.exports = authenticate;