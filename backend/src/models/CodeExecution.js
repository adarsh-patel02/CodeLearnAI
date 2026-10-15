
const mongoose = require("mongoose");

const codeExecutionSchema = new mongoose.Schema(
    {
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
            required: true
        },

        learnerId: {
            type: String,
            required: true
        },

        code: {
            type: String,
            required: true
        },

        language: {
            type: String,
            default: "python"
        },

        executionResult: {
            type: String,
            default: ""
        },

        executionStatus: {
            type: String,
            enum: ["SUCCESS", "ERROR"],
            required: true
        },

        attemptNumber: {
            type: Number,
            default: 1
        },

        assessmentMode: {
            type: String,
            enum: ["AI_ASSISTED", "NO_AI"],
            default: "AI_ASSISTED",
            required: true
        },

        occurredAt: {
            type: Date,
            default: Date.now
        },
    
        // Distinguishes experimentation from formal evaluation
        runType: {
            type: String,
            enum: ["INTERACTIVE", "SUBMISSION"],
            default: "INTERACTIVE"
        },

        // Formal test-case evaluation results
        testsPassed: {
            type: Number,
            default: null
        },
        totalTests: {
            type: Number,
            default: null
        },
        correctnessScore: {
            type: Number,
            min: 0,
            max: 100,
            default: null
        },
        executionTimeMs: {
            type: Number,
            default: null
        }

    },
    { timestamps: true }
);

module.exports = mongoose.model(
    "CodeExecution",
    codeExecutionSchema
);
