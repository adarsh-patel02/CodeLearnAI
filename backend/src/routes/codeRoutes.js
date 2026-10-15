
const express = require("express");

const {
    runCode,
    submitSolution
} = require("../controllers/codeController");

const {
    protectLearner
} = require("../middleware/authMiddleware");

const router = express.Router();

// Interactive execution: logs Run Code attempts.
router.post("/run", protectLearner, runCode);

// Formal evaluation: runs the code against task test cases.
router.post("/submit", protectLearner, submitSolution);

module.exports = router;
