
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const learnerAuthRoutes = require("./routes/learnerAuthRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const taskRoutes = require("./routes/taskRoutes");
const connectDB = require("./config/db");
const codeRoutes = require("./routes/codeRoutes");
const aiRoutes = require("./routes/aiRoutes");
const aiInteractionRoutes = require("./routes/aiInteractionRoutes");

const jwt = require("jsonwebtoken");

const {
    startInteractivePython
} = require("./services/codeExecutionService");

const CodeExecution = require("./models/CodeExecution");

connectDB();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(express.json());

app.use("/api/auth/learner", learnerAuthRoutes);
app.use("/api/auth/admin", adminAuthRoutes);
app.use("/api/code", codeRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/ai-interactions", aiInteractionRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "CodeLearn AI backend is running"
    });
});

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Authenticate every Socket.IO connection.
io.use((socket, next) => {
    try {
        const token = socket.handshake.auth?.token;

        if (!token || !process.env.JWT_SECRET) {
            return next(new Error("Authentication required."));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.id || decoded.role !== "learner") {
            return next(new Error("Access denied."));
        }

        socket.learner = {
            id: decoded.id,
            role: decoded.role
        };

        next();
    } catch {
        next(new Error("Invalid or expired token. Please sign in again."));
    }
});

io.on("connection", (socket) => {
    let execution = null;
    let executionTaskId = null;
    let executionMode = "AI_ASSISTED";
    let executionCode = "";
    let executionLanguage = "python";
    let executionAttemptNumber = 0;

    socket.on("python:start", async (payload = {}) => {
        // Do not allow overlapping executions on the same socket.
        if (execution) {
            socket.emit("python:error", "A program is already running.");
            return;
        }

        const {
            code,
            taskId,
            language = "python",
            assessmentMode = "AI_ASSISTED"
        } = payload;

        if (typeof code !== "string" || !code.trim()) {
            socket.emit("python:error", "Code is required.");
            return;
        }

        if (language.toLowerCase() !== "python") {
            socket.emit("python:error", "Only Python is supported.");
            return;
        }

        if (
            assessmentMode !== "AI_ASSISTED" &&
            assessmentMode !== "NO_AI"
        ) {
            socket.emit("python:error", "Invalid assessment mode.");
            return;
        }

        executionTaskId = taskId || null;
        executionMode = assessmentMode;
        executionCode = code;
        executionLanguage = "python";

        if (executionTaskId) {
            try {
                const previousAttempts = await CodeExecution.countDocuments({
                    taskId: executionTaskId,
                    learnerId: socket.learner.id
                });

                executionAttemptNumber = previousAttempts + 1;
            } catch (error) {
                console.error("Attempt lookup failed:", error.message);
                socket.emit("python:error", "Unable to start execution.");
                executionTaskId = null;
                return;
            }
        }

        socket.emit("python:started");

        execution = startInteractivePython(code, {
            onOutput: (chunk) => {
                socket.emit("python:output", chunk);
            },

            onError: (message) => {
                socket.emit("python:error", message);
            },

            onClose: async (result) => {
                // Clear the running process before notifying completion.
                execution = null;

                socket.emit("python:finished", result);

                if (executionTaskId) {
                    try {
                        await CodeExecution.create({
                            taskId: executionTaskId,
                            learnerId: socket.learner.id,
                            code: executionCode,
                            language: executionLanguage,
                            executionResult: result.success
                                ? "Program completed."
                                : result.error || `Exit code: ${result.exitCode}`,
                            executionStatus: result.success
                                ? "SUCCESS"
                                : "ERROR",
                            attemptNumber: executionAttemptNumber,
                            assessmentMode: executionMode
                        });
                    } catch (error) {
                        console.error(
                            "Interactive execution logging failed:",
                            error.message
                        );
                    }
                }

                executionTaskId = null;
            }
        });
    });

    socket.on("python:input", (value) => {
        if (typeof value !== "string" || !execution) return;
        if (value.length > 10000) return;

        execution.sendInput(value);
    });

    socket.on("python:stop", () => {
        if (execution) {
            execution.stop();
        }
    });

    socket.on("disconnect", () => {
        if (execution) {
            execution.stop();
        }
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
