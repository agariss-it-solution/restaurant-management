const Response = require("../../helper/errHandler");
const User = require("../../models/user");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const register = async (req, res) => {
    try {
      
        const { email, password, role } = req.body;

        // Validate input
        if (!email || !password || !role) {
            return Response.Error({
                res,
                status: 400,
                message: "Email, password and role are required",
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return Response.Error({
                res,
                status: 409,
                message: "User already registered",
            });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = new User({
            email,
            password: hashedPassword,
            role,
        });

        await newUser.save();

        return Response.Success({
            res,
            status: 201,
            message: "User registered successfully",
            data: { email: newUser.email, role: newUser.role },
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

module.exports = register;
