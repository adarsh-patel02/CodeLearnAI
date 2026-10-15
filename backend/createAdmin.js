
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./src/models/Admin");

const createAdmin = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing from backend/.env");
        }

        const name = process.env.ADMIN_NAME?.trim();
        const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const password = process.env.ADMIN_PASSWORD;

        if (!name || !email || !password) {
            throw new Error(
                "Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD in backend/.env"
            );
        }

        if (password.length < 12) {
            throw new Error(
                "Use an admin password of at least 12 characters."
            );
        }

        await mongoose.connect(process.env.MONGO_URI);

        const existingAdmin = await Admin.findOne({ email });

        if (existingAdmin) {
            console.log("An admin account already exists for this email.");
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await Admin.create({
            name,
            email,
            password: hashedPassword,
            role: "admin"
        });

        console.log("Admin account created successfully.");
        console.log(`Admin email: ${email}`);
    } catch (error) {
        console.error("Admin setup failed:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect().catch(() => {});
    }
};

createAdmin();
