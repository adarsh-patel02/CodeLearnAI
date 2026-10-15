const path = require("path");
const { spawn } = require("child_process");

const predictCompetency = ({ learnerId }) => {
    return new Promise((resolve, reject) => {
        const scriptPath = path.resolve(
            __dirname,
            "../../ml/predict_overall_competency.py"
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
                try {
                    const payload = JSON.parse(stdout);
                    reject(new Error(payload.error || "Competency prediction failed"));
                } catch {
                    reject(
                        new Error(
                            stderr.trim() ||
                                `Competency prediction process exited with code ${code}`
                        )
                    );
                }
                return;
            }

            try {
                const result = JSON.parse(stdout);

                if (result.error) {
                    reject(new Error(result.error));
                    return;
                }

                resolve(result);
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
