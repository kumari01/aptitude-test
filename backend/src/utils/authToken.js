const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT || "sasi_aptitude_test_secret_key_1234567890";

/**
 * Signs a JWT for the given user and sets it as an httpOnly cookie.
 * @param {Object} res - Express response object
 * @param {String|ObjectId} id - user id
 * @param {String} role - "student" | "admin"
 * @returns {String} signed token
 */
const issueAuthToken = (res, id, role) => {
    // 4 hours token lifetime: ideal for campus exam shifts
    const token = jwt.sign(
        { id, role },
        JWT_SECRET,
        { expiresIn: "4h" }
    );

    if (res && res.cookie) {
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 4 * 60 * 60 * 1000
        });
    }

    return token;
};

/**
 * Refreshes an existing valid or recently active token
 * @param {String} token
 * @param {Object} res
 * @returns {String|null} new token
 */
const verifyAndRefreshToken = (token, res) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: false });
        return issueAuthToken(res, decoded.id, decoded.role);
    } catch (err) {
        return null;
    }
};

module.exports = { issueAuthToken, verifyAndRefreshToken };