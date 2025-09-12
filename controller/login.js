const Response = require("../helper/errHandler");
const User = require("../models/user");
const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return Response.Error({
                res,
                status: 400,
                message: "Email and password are required",
            });
        }
                // Find user
        const user = await User.findOne({ email: email });
        if (!user) {
            return Response.Error({
                res,
                status: 401,
                message: "Invalid email or password",
            });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return Response.Error({
                res,
                status: 401,
                message: "Invalid email or password",
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        return Response.Success({
            res,
            status: 200,
            message: "Login successful",
            data: { token, email: user.email, role: user.role },
        });
    } catch (error) {
        return Response.Error({
            res,
            status: 500,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

module.exports = login;