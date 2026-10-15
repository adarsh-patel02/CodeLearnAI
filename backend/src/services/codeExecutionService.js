
const { spawn } = require("child_process");

// Batch execution is used by Run Code and the test-case evaluator.
// Suppress input() prompts so they do not contaminate stdout comparisons
// (for example, "Enter number: 120" versus expected output "120").
const executePython = (code, input = "") => {
    return new Promise((resolve) => {
        const wrappedCode = [
            "import builtins as _codelearn_builtins",
            "_codelearn_original_input = _codelearn_builtins.input",
            "def _codelearn_input_without_prompt(prompt=''):",
            "    return _codelearn_original_input()",
            "_codelearn_builtins.input = _codelearn_input_without_prompt",
            code
        ].join("\n");

        const python = spawn(
            "python",
            ["-c", wrappedCode],
            { windowsHide: true }
        );

        let output = "";
        let error = "";
        let settled = false;
        let timedOut = false;

        const finish = (result) => {
            if (settled) return;

            settled = true;
            clearTimeout(timeout);
            resolve(result);
        };

        const timeout = setTimeout(() => {
            timedOut = true;
            python.kill();

            finish({
                success: false,
                error: "Execution timed out after 10 seconds."
            });
        }, 10000);

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

// Interactive execution preserves normal input() prompts and supports
// sending input while the Python process is running.
const startInteractivePython = (code, callbacks = {}) => {
    const {
        onOutput = () => {},
        onError = () => {},
        onClose = () => {}
    } = callbacks;

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
                python.stdin.write(`${value}\\n`);
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
