const path = require("path");
const { spawn } = require("child_process");

const predictCompetency = ({ learnerId }) => {
    return new Promise((resolve, reject) => {
        const scriptPath = path.resolve(
            __dirname,
            "../../ml/predict_competency.py"
        );

        const pythonProcess = spawn("python", [
            scriptPath,
            String(learnerId)
        ]);

        let stdout = "";
        let stderr = "";

        pythonProcess.stdout.on("data", (data) => {
            stdout += data.toString();
        });

        pythonProcess.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        pythonProcess.on("error", (error) => {
            reject(error);
        });

        pythonProcess.on("close", (code) => {
            if (code !== 0) {
                reject(
                    new Error(
                        stderr.trim() ||
                            `Competency prediction process exited with code ${code}`
                    )
                );
                return;
            }

            try {
                resolve(JSON.parse(stdout));
            } catch (error) {
                reject(
                    new Error(
                        `Invalid competency prediction response: ${error.message}`
                    )
                );
            }
        });
    });
};

module.exports = {
    predictCompetency
};
