
const express = require("express");
const router = express.Router();

const {
    getTasks,
    getTaskById,
    createTask,
    deleteTask,
    updateTask,
    getMatchedNoAITask
} = require("../controllers/taskController");

const {
    protectLearner
} = require("../middleware/authMiddleware");

router.get("/", getTasks);

// A learner must be authenticated to receive a matched assessment task.
router.get(
    "/matched-no-ai/:originalTaskId",
    protectLearner,
    getMatchedNoAITask
);

router.get("/:id", getTaskById);

// These task-management routes are not protected by this learner middleware.
// We'll handle admin authorization separately.
router.post("/", createTask);
router.delete("/:id", deleteTask);
router.put("/:id", updateTask);

module.exports = router;
