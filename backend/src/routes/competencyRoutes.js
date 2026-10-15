const express = require("express");

const { getMyCompetency } = require("../controllers/competencyController");
const { protectLearner } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", protectLearner, getMyCompetency);

module.exports = router;
