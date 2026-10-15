const express = require("express");

const {
    chatWithAI,
    generateTasks
} = require("../controllers/aiController");

const router = express.Router();

router.post("/chat", chatWithAI);
router.post("/generate-tasks", generateTasks);

module.exports = router;
