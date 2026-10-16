
const mongoose = require("mongoose");
const { executePython } = require("../services/codeExecutionService");
const CodeExecution = require("../models/CodeExecution");
const Task = require("../models/Task");

// Interactive Run Code: execute code and record an attempt.
const runCode = async (req, res) => {
    try {
        const {
            code,
            language = "python",
            taskId,
            input = "",
            assessmentMode = "AI_ASSISTED"
        } = req.body;

        if (typeof code !== "string" || !code.trim()) {
            return res.status(400).json({
                success: false,
                message: "Code is required"
            });
        }

        if (language !== "python") {
            return res.status(400).json({
                success: false,
                message: "Only Python is supported currently"
            });
        }

        if (!["AI_ASSISTED", "NO_AI"].includes(assessmentMode)) {
            return res.status(400).json({
                success: false,
                message: "Invalid assessment mode"
            });
        }

        const result = await executePython(code, input);

        if (taskId) {
            if (!mongoose.isValidObjectId(taskId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid task ID"
                });
            }

            try {
                const learnerId = req.learner.id;

                const previousAttempts = await CodeExecution.countDocuments({
                    taskId,
                    learnerId,
                    assessmentMode,
                    runType: "INTERACTIVE"
                });

                await CodeExecution.create({
                    taskId,
                    learnerId,
                    code,
                    language,
                    executionResult: result.success
                        ? result.output
                        : result.error,
                    executionStatus: result.success ? "SUCCESS" : "ERROR",
                    attemptNumber: previousAttempts + 1,
                    assessmentMode,
                    runType: "INTERACTIVE"
                });
            } catch (loggingError) {
                console.error(
                    "Interactive execution logging failed:",
                    loggingError.message
                );
            }
        }

        return res.json(result);
    } catch (error) {
        console.error("Code execution error:", error);

        return res.status(500).json({
            success: false,
            message: "Code execution failed"
        });
    }
};

// Formal Submit Solution: evaluate code against server-side test cases.
const submitSolution = async (req, res) => {
    try {
        const {
            code,
            taskId,
            language = "python",
            assessmentMode = "AI_ASSISTED"
        } = req.body;

        if (typeof code !== "string" || !code.trim()) {
            return res.status(400).json({
                success: false,
                message: "Code is required"
            });
        }

        if (language !== "python") {
            return res.status(400).json({
                success: false,
                message: "Only Python is supported currently"
            });
        }

        if (!mongoose.isValidObjectId(taskId)) {
            return res.status(400).json({
                success: false,
                message: "A valid task ID is required"
            });
        }

        if (!["AI_ASSISTED", "NO_AI"].includes(assessmentMode)) {
            return res.status(400).json({
                success: false,
                message: "Invalid assessment mode"
            });
        }

        // Test cases are loaded only on the backend.
        const task = await Task.findOne({
            _id: taskId,
            isActive: true
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found or inactive"
            });
        }

        if (task.language.toLowerCase() !== language) {
            return res.status(400).json({
                success: false,
                message: "The submitted language does not match the task"
            });
        }

        const testCases = task.testCases || [];

        if (testCases.length === 0) {
            return res.status(400).json({
                success: false,
                message: "This task has no test cases configured"
            });
        }

        const startedAt = Date.now();
        const results = [];
        let testsPassed = 0;
        let hadRuntimeError = false;

        const normalizeOutput = (value) =>
            String(value ?? "").replace(/\r\n/g, "\n").trim();

        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];

            // Provide stdin input to this individual test execution.
            let testInput = testCase.input ?? "";
            if (testInput && !testInput.endsWith("\n")) {
                testInput += "\n";
            }

            const execution = await executePython(code, testInput);

            const passed =
                execution.success &&
                normalizeOutput(execution.output) ===
                    normalizeOutput(testCase.expectedOutput);

            if (passed) {
                testsPassed++;
            }

            if (!execution.success) {
                hadRuntimeError = true;
            }

            // Do not send expected outputs or hidden test data to the client.
            results.push({
                testCase: i + 1,
                passed,
                status: execution.success ? "EXECUTED" : "RUNTIME_ERROR"
            });
        }

        const totalTests = testCases.length;
        const correctnessScore = Number(
            ((testsPassed / totalTests) * 100).toFixed(2)
        );
        const executionTimeMs = Date.now() - startedAt;
        const learnerId = req.learner.id;

        const previousSubmissions = await CodeExecution.countDocuments({
            taskId,
            learnerId,
            assessmentMode,
            runType: "SUBMISSION"
        });

        await CodeExecution.create({
            taskId,
            learnerId,
            code,
            language,
            executionResult: `${testsPassed}/${totalTests} tests passed`,
            executionStatus: hadRuntimeError ? "ERROR" : "SUCCESS",
            attemptNumber: previousSubmissions + 1,
            assessmentMode,
            runType: "SUBMISSION",
            testsPassed,
            totalTests,
            correctnessScore,
            executionTimeMs
        });

        return res.status(200).json({
            success: true,
            message: "Solution evaluated",
            testsPassed,
            totalTests,
            correctnessScore,
            executionTimeMs,
            results
        });
    } catch (error) {
        console.error("Solution submission error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to evaluate solution"
        });
    }
};

module.exports = {
    runCode,
    submitSolution
};
