
const bcrypt = require("bcryptjs");
const Learner = require("../models/Learner");
const jwt = require("jsonwebtoken");

const registerLearner = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and password are required."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingLearner = await Learner.findOne({
            email: normalizedEmail
        });

        if (existingLearner) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const learner = await Learner.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword
        });

        return res.status(201).json({
            success: true,
            message: "Learner registered successfully.",
            learner: {
                id: learner._id,
                name: learner.name,
                email: learner.email,
                role: learner.role
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        console.error("Learner registration error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to register learner."
        });
    }
};



const loginLearner = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const learner = await Learner.findOne({
            email: normalizedEmail
        }).select("+password");

        if (!learner) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            learner.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // Ensure the JWT secret is configured.
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing from backend/.env");

            return res.status(500).json({
                success: false,
                message: "Server authentication is not configured."
            });
        }

        // Generate a signed JWT for the authenticated learner.
        const token = jwt.sign(
            {
                id: learner._id.toString(),
                role: learner.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            learner: {
                id: learner._id,
                name: learner.name,
                email: learner.email,
                role: learner.role
            }
        });
    } catch (error) {
        console.error("Learner login error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to log in."
        });
    }
};



module.exports = {
    registerLearner,
    loginLearner
};
