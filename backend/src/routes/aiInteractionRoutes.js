
const express = require("express");
const router = express.Router();

const {
    saveAIInteraction
} = require("../controllers/aiInteractionController");

const {
    protectLearner
} = require("../middleware/authMiddleware");

// Only authenticated learners can save AI interaction evidence.
router.post("/", protectLearner, saveAIInteraction);

module.exports = router;
