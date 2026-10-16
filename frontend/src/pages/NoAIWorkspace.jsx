
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { io } from "socket.io-client";
import axios from "axios";
import BackButton from "../components/common/BackButton";

const NoAIWorkspace = () => {
    const { taskId } = useParams();
    const navigate = useNavigate();

    const socketRef = useRef(null);
    const consoleRef = useRef(null);
    const inputRef = useRef(null);

    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [code, setCode] = useState("");
    const [output, setOutput] = useState("");
    const [consoleInput, setConsoleInput] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionResult, setSubmissionResult] = useState(null);
    const [submissionError, setSubmissionError] = useState("");

    useEffect(() => {
        const fetchTask = async () => {
            const token = localStorage.getItem("learnerToken");

            if (!token) {
                navigate("/login/learner");
                return;
            }

            try {
                setLoading(true);
                setError("");

                const response = await axios.get(
                    `http://localhost:5000/api/tasks/${taskId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const fetchedTask = response.data.task;

                if (!fetchedTask) {
                    setError("Task not found.");
                    return;
                }

                setTask(fetchedTask);
                setCode(fetchedTask.starterCode || "");
                setOutput("");
            } catch (err) {
                console.error("Fetch Task Error:", err);

                if (err.response?.status === 401) {
                    localStorage.removeItem("learnerToken");
                    localStorage.removeItem("learner");
                    navigate("/login/learner");
                    return;
                }

                setError(
                    err.response?.data?.message ||
                    "Unable to load this task."
                );
            } finally {
                setLoading(false);
            }
        };

        if (!taskId) {
            setError("No task ID was provided.");
            setLoading(false);
            return;
        }

        fetchTask();
    }, [taskId, navigate]);

    // Create an authenticated Socket.IO connection.
    useEffect(() => {
        const token = localStorage.getItem("learnerToken");

        if (!token) return;

        const socket = io("http://localhost:5000", {
            auth: { token }
        });

        socketRef.current = socket;

        socket.on("connect_error", (err) => {
            console.error("Console connection error:", err.message);
            setOutput((previous) =>
                `${previous}\nConnection error: ${err.message}`.trim()
            );
        });

        socket.on("python:started", () => {
            setIsRunning(true);
        });

        socket.on("python:output", ({ data }) => {
            setOutput((previous) => previous + data);
        });

        socket.on("python:error", (message) => {
            setOutput((previous) =>
                `${previous}\n${message}\n`
            );
        });

        socket.on("python:finished", (result) => {
            setIsRunning(false);
            setOutput((previous) =>
                `${previous}\n${result.success
                    ? "\nDone."
                    : "\nError."}`
            );
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (consoleRef.current) {
            consoleRef.current.scrollTop =
                consoleRef.current.scrollHeight;
        }
    }, [output]);

    const handleRunCode = () => {
        if (!task || isRunning || isSubmitting) return;

        const socket = socketRef.current;

        if (!socket?.connected) {
            setOutput("Console is not connected. Please wait or refresh.");
            return;
        }

        setOutput("");
        setConsoleInput("");
        setIsRunning(true);

        socket.emit("python:start", {
            code,
            language: task.language || "python",
            taskId: task._id,
            assessmentMode: "NO_AI"
        });
    };

    const handleConsoleSubmit = (event) => {
        event.preventDefault();

        if (!isRunning) return;

        const socket = socketRef.current;
        if (!socket?.connected) return;

        // Echo the typed input into the console, like a terminal.
        setOutput((previous) => previous + consoleInput + "\n");
        socket.emit("python:input", consoleInput);

        setConsoleInput("");
        inputRef.current?.focus();
    };

    const handleSubmitSolution = async () => {
        if (!task || isRunning || isSubmitting) return;

        const token = localStorage.getItem("learnerToken");

        if (!token) {
            navigate("/login/learner");
            return;
        }

        setIsSubmitting(true);
        setSubmissionResult(null);
        setSubmissionError("");

        try {
            const response = await axios.post(
                "http://localhost:5000/api/code/submit",
                {
                    code,
                    taskId: task._id,
                    language: (task.language || "python").toLowerCase(),
                    assessmentMode: "NO_AI"
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setSubmissionResult(response.data);
        } catch (error) {
            setSubmissionError(
                error.response?.data?.message ||
                "Unable to evaluate your solution. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleStopCode = () => {
        socketRef.current?.emit("python:stop");
        setIsRunning(false);
    };

    if (loading) {
        return (
            <div className="no-ai-workspace">
                <h2>Loading Independent Assessment...</h2>
            </div>
        );
    }

    if (error || !task) {
        return (
            <div className="no-ai-workspace">
                <h2>Unable to Load Task</h2>
                <p>{error || "Task not found."}</p>
                <button onClick={() => navigate("/learning")}>
                    Back to Learning
                </button>
            </div>
        );
    }

    return (
        <div className="no-ai-workspace">
            <main>
                <BackButton fallback="/learning" />
            </main>

            <header className="no-ai-header">
                <div>
                    <h2>Independent Assessment</h2>
                    <p>
                        Solve the programming task independently.
                        AI assistance is not available in this workspace.
                    </p>
                </div>
                <span className="assessment-badge">No-AI Mode</span>
            </header>

            <div className="no-ai-layout">
                <section className="no-ai-question">
                    <h3>{task.title}</h3>

                    <div className="task-meta">
                        <span>{task.topic}</span>
                        <span>{task.difficulty}</span>
                        <span>{task.language}</span>
                    </div>

                    <h4>Problem Description</h4>
                    <p>{task.description}</p>

                    <h4>Example Input</h4>
                    <pre>{task.exampleInput || "Not provided"}</pre>

                    <h4>Expected Output</h4>
                    <pre>{task.exampleOutput || "Not provided"}</pre>
                </section>

                <section className="no-ai-editor">
                    <h3>Code Editor</h3>

                    <Editor
                        height="420px"
                        language={(task.language || "python").toLowerCase()}
                        value={code}
                        onChange={(value) => setCode(value || "")}
                        theme="vs-dark"
                        options={{
                            minimap: { enabled: false },
                            fontSize: 15,
                            automaticLayout: true
                        }}
                    />

                    {(submissionResult || submissionError) && (
                        <div
                            className="submission-result"
                            aria-live="polite"
                            style={{
                                marginTop: "16px",
                                padding: "16px",
                                border: "1px solid #ccc",
                                borderRadius: "8px"
                            }}
                        >
                            <h3>Submission Results</h3>

                            {submissionError && (
                                <p role="alert">{submissionError}</p>
                            )}

                            {submissionResult && (
                                <>
                                    <p>
                                        Tests passed:{" "}
                                        {submissionResult.testsPassed}/
                                        {submissionResult.totalTests}
                                    </p>

                                    <p>
                                        Correctness score:{" "}
                                        {submissionResult.correctnessScore}%
                                    </p>

                                    <p>
                                        Evaluation time:{" "}
                                        {submissionResult.executionTimeMs} ms
                                    </p>

                                    <ul>
                                        {submissionResult.results?.map((result) => (
                                            <li key={result.testCase}>
                                                Test {result.testCase}:{" "}
                                                {result.passed ? "Passed" : result.status === "RUNTIME_ERROR" ? "Runtime error" : "Failed (output mismatch)"}
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                    )}
                    <div className="no-ai-console">
                        <div className="no-ai-console-header">
                            <h4>Program Console</h4>

                            <div>
                                <button
                                    type="button"
                                    onClick={handleRunCode}
                                    disabled={isRunning || isSubmitting}
                                >
                                    Run Code
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSubmitSolution}
                                    disabled={isRunning || isSubmitting || !code.trim()}
                                >
                                    {isSubmitting ? "Evaluating..." : "Submit Solution"}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleStopCode}
                                    disabled={!isRunning}
                                >
                                    Stop
                                </button>
                            </div>
                        </div>

                        <pre
                            className="no-ai-console-output"
                            ref={consoleRef}
                        >
                            {output || "Output will appear here..."}
                        </pre>

                        <form
                            className="no-ai-console-input"
                            onSubmit={handleConsoleSubmit}
                        >
                            <span>&gt;</span>
                            <input
                                ref={inputRef}
                                value={consoleInput}
                                onChange={(event) =>
                                    setConsoleInput(event.target.value)
                                }
                                disabled={!isRunning}
                                placeholder={
                                    isRunning
                                        ? "Enter input and press Enter"
                                        : "Run your program first"
                                }
                                autoComplete="off"
                            />
                            <button
                                type="submit"
                                disabled={!isRunning}
                            >
                                Enter
                            </button>
                        </form>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default NoAIWorkspace;
