const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    let token = req.header("Authorization");

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access denied. No token provided."
        });
    }

    try {
        if (token.startsWith("Bearer ")) {
            token = token.slice(7).trim();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded;
        next();

    } catch (error) {
        console.error("adminAuth error:", error);
        return res.status(400).json({
            success: false,
            message: "Invalid token"
        });
    }
};
