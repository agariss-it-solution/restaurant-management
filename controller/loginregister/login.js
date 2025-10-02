const Response = require("../../helper/errHandler");
const User = require("../../models/user");
const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const sendEmail = require("../utils/emailUtils");
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



const logout = async (req, res) => {
    try {
        // If using cookies to store token, clear it
        // res.clearCookie("token");

        // If using Authorization header, just inform client to delete it locally
        return Response.Success({
            res,
            status: 200,
            message: "Logout successful",
            data: null,
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
const sendResetPasswordEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate a JWT token with email and expiry time (30 minutes)
        const token = jwt.sign(
            { email: user.email },
            process.env.JWT_SECRET
        );

        // Build reset link
        const resetLink = `${process.env.FRONTEND_URL}/?token=${token}&email=${email}`;

        // Email body template with a professional look
        const emailBody = `
            <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            color: #333;
                            line-height: 1.6;
                            margin: 0;
                            padding: 20px;
                            background-color: #f4f4f4;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            background-color: #fff;
                            padding: 20px;
                            border-radius: 8px;
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        }
                        h1 {
                            color: #333;
                        }
                        p {
                            font-size: 16px;
                        }
                        a {
                            color: #3498db;
                            text-decoration: none;
                            font-weight: bold;
                        }
                        .footer {
                            margin-top: 20px;
                            font-size: 12px;
                            color: #aaa;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Password Reset Request</h1>
                        <p>Hello,</p>
                        <p>We received a request to reset the password for your account at <strong>${process.env.WEBSITE_NAME || 'Our Website'}</strong>.</p>
                        <p>Please click the link below to reset your password. This link will expire in 30 minutes:</p>
                        <p><a href="${resetLink}">${resetLink}</a></p>
                        <p>If you did not request a password reset, please ignore this email or contact support if you have any concerns.</p>
                        <div class="footer">
                            <p>&copy; ${new Date().getFullYear()} ${process.env.WEBSITE_NAME || 'Our Website'}. All rights reserved.</p>
                        </div>
                    </div>
                </body>
            </html>
        `;

        // Send the reset link email
        await sendEmail({
            to: user.email,
            subject: "Reset Your Password",
            html: emailBody,
        });

        res.status(200).json({ message: "Reset password email sent successfully", data: resetLink });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};


const resetPassword = async (req, res) => {
    try {
        const { email, token, newPassword } = req.body;

        if (!email || !newPassword || !token) {
            return res.status(400).json({ message: "Email, new password, and token are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify the token
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.email !== email) {
                return res.status(400).json({ message: "Invalid token" });
            }
        } catch (error) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        // Clear reset token and expiry
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;

        await user.save();

        res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

module.exports = { login, logout,sendResetPasswordEmail , resetPassword };