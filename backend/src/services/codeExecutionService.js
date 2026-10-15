
const { spawn } = require("child_process");


const executePython = (code, input = "") => {
    return new Promise((resolve) => {
        const python = spawn(
            "python",
            ["-c", code],
            { windowsHide: true }
        );

        let output = "";
        let error = "";
        let settled = false;
        let timedOut = false;

        const timeout = setTimeout(() => {
            timedOut = true;
            python.kill();

            finish({
                success: false,
                error: "Execution timed out after 10 seconds."
            });
        }, 10000);

        const finish = (result) => {
            if (settled) return;

            settled = true;
            clearTimeout(timeout);
            resolve(result);
        };

        python.stdout.on("data", (data) => {
            output += data.toString();
        });

        python.stderr.on("data", (data) => {
            error += data.toString();
        });

        python.on("error", (err) => {
            finish({
                success: false,
                error: err.message
            });
        });

        python.on("close", (exitCode) => {
            if (timedOut) return;

            if (exitCode === 0) {
                finish({
                    success: true,
                    output: output.trim()
                });
            } else {
                finish({
                    success: false,
                    error: error.trim() || "Python execution failed."
                });
            }
        });

        python.stdin.on("error", () => {});
        python.stdin.end(input);
    });
};

// New function — keeps Python alive for interactive input.
const startInteractivePython = (code, callbacks = {}) => {
    const {
        onOutput = () => {},
        onError = () => {},
        onClose = () => {}
    } = callbacks;

    // -u disables Python's stdout/stderr buffering.
    const python = spawn("python", ["-u", "-c", code], {
        stdio: ["pipe", "pipe", "pipe"],
        windowsHide: true
    });

    let closed = false;
    let timeout;

    const finish = (result) => {
        if (closed) return;
        closed = true;
        clearTimeout(timeout);
        onClose(result);
    };

    // Prevent a learner's program from running forever.
    timeout = setTimeout(() => {
        onError("Execution timed out.");
        python.kill();
    }, 10000);

    python.stdout.on("data", (data) => {
        onOutput({
            type: "stdout",
            data: data.toString()
        });
    });

    python.stderr.on("data", (data) => {
        onOutput({
            type: "stderr",
            data: data.toString()
        });
    });

    python.on("error", (error) => {
        finish({
            success: false,
            error: error.message
        });
    });

    python.on("close", (exitCode) => {
        finish({
            success: exitCode === 0,
            exitCode
        });
    });

    return {
        sendInput(value) {
            if (!closed && python.stdin.writable) {
                python.stdin.write(`${value}\n`);
            }
        },

        stop() {
            if (!closed) {
                python.kill();
            }
        }
    };
};

module.exports = {
    executePython,
    startInteractivePython
};
