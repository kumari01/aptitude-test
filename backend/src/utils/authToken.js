const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT;

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
    // Fail loudly on boot rather than silently signing tokens with a
    // guessable default secret in production.
    throw new Error('JWT_SECRET (or JWT) environment variable must be set in production');
}

/**
 * Signs a JWT for the given user and sets it as an httpOnly cookie.
 * Used identically by student and admin login so the two flows can't
 * silently drift (cookie options, expiry, etc.) the way they had
 * started to.
 *
 * @param {Object} res - Express response object
 * @param {String|ObjectId} id - user id to embed in the token
 * @param {String} role - "student" | "admin"
 * @returns {String} the signed token
 */
const issueAuthToken = (res, id, role) => {
    const token = jwt.sign(
        { id, role },
        JWT_SECRET || "default_jwt_secret",
        { expiresIn: "1h" }
    );

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 1000
    });

    return token;
};

module.exports = { issueAuthToken };