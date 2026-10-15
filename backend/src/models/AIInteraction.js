
const mongoose = require("mongoose");

const aiInteractionSchema = new mongoose.Schema(
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
        query: {
            type: String,
            required: true
        },
        response: {
            type: String,
            required: true
        },
        assistanceType: {
            type: String,
            enum: [
                "CONCEPTUAL_EXPLANATION",
                "THEORY_QUESTION",
                "HINT",
                "DEBUGGING",
                "CODE_EXPLANATION",
                "CODE_IMPROVEMENT",
                "DIRECT_CODE_GENERATION",
                "DIRECT_SOLUTION",
                "EXAMPLE_REQUEST",
                "OTHER",
                "UNKNOWN"
            ],
            default: "UNKNOWN"
        },
        occurredAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model(
    "AIInteraction",
    aiInteractionSchema
);
