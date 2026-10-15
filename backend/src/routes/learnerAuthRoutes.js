
const express = require("express");
const router = express.Router();

const {
    registerLearner,
    loginLearner
} = require("../controllers/learnerAuthController");

router.post("/register", registerLearner);
router.post("/login", loginLearner);

module.exports = router;
