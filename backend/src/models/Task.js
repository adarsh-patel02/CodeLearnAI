const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true
        },

        difficulty: {
            type: String,
            enum: ["Easy", "Medium", "Hard"],
            required: true
        },

        language: {
            type: String,
            default: "python"
        },

        topic: {
            type: String,
            required: true
        },

        starterCode: {
            type: String,
            default: ""
        },


        evaluationType: {
            type: String,
            enum: ["STDIN", "FUNCTION"],
            default: "STDIN"
        },
        functionName: {
            type: String,
            default: "",
            trim: true
        },


        exampleInput: {
            type: String,
            default: ""
        },

        exampleOutput: {
            type: String,
            default: ""
        },
        testCases: [
            {
                input: {
                    type: String,
                    default: ""
                },
                expectedOutput: {
                    type: String,
                    required: true
                },
                isHidden: {
                    type: Boolean,
                    default: false
                }
            }
        ],

        isActive: {
            type: Boolean,
            default: true
        }
    },

    {
        timestamps: true
    }
);

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;