const { predictCompetency } = require("../services/competencyService");

const getMyCompetency = async (req, res) => {
    try {
        const result = await predictCompetency({
            learnerId: req.learner.id
        });

        return res.status(200).json({
            success: true,
            competency: result
        });
    } catch (error) {
        console.error("Competency prediction error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to calculate competency at this time."
        });
    }
};

module.exports = {
    getMyCompetency
};
