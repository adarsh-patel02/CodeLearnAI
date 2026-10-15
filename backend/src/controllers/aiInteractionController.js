
const AIInteraction = require("../models/AIInteraction");
const Task = require("../models/Task");

const saveAIInteraction = async (req, res) => {
    try {
        const {
            taskId,
            query,
            response,
            assistanceType
        } = req.body;

        const learnerId = req.learner.id;

        if (!taskId || !query || !response) {
            return res.status(400).json({
                success: false,
                message: "Task ID, query, and response are required."
            });
        }

        if (!/^[a-fA-F0-9]{24}$/.test(taskId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task ID."
            });
        }

        const taskExists = await Task.exists({ _id: taskId });

        if (!taskExists) {
            return res.status(404).json({
                success: false,
                message: "Task not found."
            });
        }

        const interaction = await AIInteraction.create({
            taskId,
            learnerId,
            query,
            response,
            assistanceType: assistanceType || "UNKNOWN",
            occurredAt: new Date()
        });

        return res.status(201).json({
            success: true,
            message: "AI interaction evidence saved.",
            interactionId: interaction._id
        });
    } catch (error) {
        console.error("Save AI Interaction Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to save AI interaction evidence."
        });
    }
};

module.exports = { saveAIInteraction };
