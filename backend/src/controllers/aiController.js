const {
    generateAIResponse,
    generateProgrammingTasks
} = require("../services/aiService");

const chatWithAI = async (req, res) => {
    try {
        const {
            message,
            taskTitle,
            taskDescription,
            code
        } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: "Message is required"
            });
        }

        const response = await generateAIResponse(message, {
            taskTitle,
            taskDescription,
            code
        });

        res.json({
            success: true,
            response
        });
    } catch (error) {
        console.error("AI Chat Error:", error);

        res.status(500).json({
            success: false,
            message: "AI response generation failed",
            error: error.message
        });
    }
};

const generateTasks = async (req, res) => {
    try {
        const {
            topic,
            difficulty,
            language,
            count
        } = req.body;

        if (
            typeof topic !== "string" ||
            !topic.trim() ||
            !["Easy", "Medium", "Hard"].includes(difficulty) ||
            typeof language !== "string" ||
            !language.trim() ||
            !Number.isInteger(Number(count)) ||
            Number(count) < 1 ||
            Number(count) > 10
        ) {
            return res.status(400).json({
                success: false,
                message: "Provide a topic, valid difficulty, language, and task count between 1 and 10."
            });
        }

        const tasks = await generateProgrammingTasks({
            topic: topic.trim(),
            difficulty,
            language: language.trim(),
            count: Number(count)
        });

        return res.json({
            success: true,
            message: "Tasks generated successfully",
            tasks
        });
    } catch (error) {
        console.error("AI Task Generation Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to generate programming tasks"
        });
    }
};

module.exports = {
    chatWithAI,
    generateTasks
};
