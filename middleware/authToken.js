const jwt = require("jsonwebtoken");
const Response = require("../helper/errHandler");
const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return Response.Error({
                res,
                status: 401,
                message: "Access denied. No token provided.",
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        req.user = decoded; // Attach user info (id, email, role)
        next();
    } catch (err) {
        return Response.Error({
            res,
            status: 401,
            message: "Invalid or expired token",
            error: err.message,
        });
    }
};

module.exports = authMiddleware;
