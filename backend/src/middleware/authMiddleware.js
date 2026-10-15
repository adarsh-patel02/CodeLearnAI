
const jwt = require("jsonwebtoken");

const protectLearner = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please sign in."
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication token is missing."
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not configured.");

            return res.status(500).json({
                success: false,
                message: "Server authentication is not configured."
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.id || decoded.role !== "learner") {
            return res.status(403).json({
                success: false,
                message: "Access denied."
            });
        }

        req.learner = {
            id: decoded.id,
            role: decoded.role
        };

        next();
    } catch (error) {
    console.error("JWT verification failed:", error.name, error.message);

    return res.status(401).json({
        success: false,
        message: "Invalid or expired token. Please sign in again."
    });
}
};

module.exports = { protectLearner };
