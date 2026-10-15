
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./src/models/Admin");
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (question) =>
    new Promise((resolve) => rl.question(question, resolve));

async function resetAdminPassword() {
    try {
        if (!process.env.MONGO_URI || !process.env.ADMIN_EMAIL) {
            throw new Error(
                "MONGO_URI and ADMIN_EMAIL must be configured in .env"
            );
        }

        const password = await ask("Enter a new admin password: ");

        if (password.length < 12) {
            throw new Error(
                "Use a password with at least 12 characters."
            );
        }

        await mongoose.connect(process.env.MONGO_URI);

        const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
        const admin = await Admin.findOne({ email });

        if (!admin) {
            throw new Error(
                "Admin account not found for ADMIN_EMAIL."
            );
        }

        admin.password = await bcrypt.hash(password, 12);
        await admin.save();

        console.log("Admin password reset successfully.");
    } catch (error) {
        console.error("Password reset failed:", error.message);
        process.exitCode = 1;
    } finally {
        rl.close();
        await mongoose.disconnect().catch(() => {});
    }
}

resetAdminPassword();
