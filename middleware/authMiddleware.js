const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    // Get token from header
    let token = req.header("Authorization");

    // Check if no token
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access denied. No token provided."
        });
    }

    try {
        // Support "Bearer <token>" format
        if (token.startsWith("Bearer ")) {
            token = token.slice(7, token.length).trimLeft();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Contains { userId: ... } based on userController
        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }
};
