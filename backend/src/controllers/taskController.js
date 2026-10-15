const Task = require("../models/Task");
const mongoose = require("mongoose");

// Get all active tasks
const getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ isActive: true })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            tasks
        });

    } catch (error) {
        console.error("Get Tasks Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch tasks"
        });
    }
};


// Get single task
const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        res.json({
            success: true,
            task
        });

    } catch (error) {
        console.error("Get Task Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch task"
        });
    }
};


// Create task
const createTask = async (req, res) => {
    try {
        const task = await Task.create(req.body);

        res.status(201).json({
            success: true,
            message: "Task created successfully",
            task
        });

    } catch (error) {
        console.error("Create Task Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create task"
        });
    }
};



// Delete task
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        res.json({
            success: true,
            message: "Task deleted successfully"
        });

    } catch (error) {
        console.error("Delete Task Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete task"
        });
    }
};

//for updating the uploaded tasks
const updateTask = async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Task updated successfully",
            task
        });
    } catch (error) {
        console.error("Update Task Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update task"
        });
    }
};


const getMatchedNoAITask = async (req, res) => {
    try {
        const { originalTaskId } = req.params;

        if (!mongoose.isValidObjectId(originalTaskId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid original task ID."
            });
        }

        const originalTask = await Task.findOne({
            _id: originalTaskId,
            isActive: true
        });

        if (!originalTask) {
            return res.status(404).json({
                success: false,
                message: "Original task not found or inactive."
            });
        }

        const matchedTask = await Task.aggregate([
            {
                $match: {
                    _id: {
                        $ne: originalTask._id
                    },
                    topic: originalTask.topic,
                    difficulty: originalTask.difficulty,
                    language: originalTask.language,
                    isActive: true
                }
            },
            { $sample: { size: 1 } }
        ]);

        if (matchedTask.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "No different active task matches this topic, difficulty, and language."
            });
        }

        return res.status(200).json({
            success: true,
            originalTaskId: originalTask._id,
            task: matchedTask[0]
        });
    } catch (error) {
        console.error("Matched No-AI Task Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to find a matched assessment task."
        });
    }
};

module.exports = {
    getTasks,
    getTaskById,
    createTask,
    deleteTask,
    updateTask,
    getMatchedNoAITask
};