
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { io } from "socket.io-client";
import axios from "axios";
import AIAssistant from "../features/ai/AIAssistant";
import BackButton from "../components/common/BackButton";

const CodingWorkspace = () => {
    const { taskId } = useParams();
    const navigate = useNavigate();

    const socketRef = useRef(null);
    const consoleRef = useRef(null);
    const inputRef = useRef(null);

    const [task, setTask] = useState(null);
    const [taskLoading, setTaskLoading] = useState(true);
    const [taskError, setTaskError] = useState("");

    const [code, setCode] = useState("");
    const [output, setOutput] = useState("");
    const [consoleInput, setConsoleInput] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionResult, setSubmissionResult] = useState(null);
    const [submissionError, setSubmissionError] = useState("");

    // Fetch the selected task.
    useEffect(() => {
        let cancelled = false;

        const fetchTask = async () => {
            try {
                setTaskLoading(true);
                setTaskError("");

                const response = await axios.get(
                    `http://localhost:5000/api/tasks/${taskId}`
                );

                if (cancelled) return;

                const fetchedTask = response.data.task;

                if (!fetchedTask) {
                    setTaskError("Task not found.");
                    return;
                }

                setTask(fetchedTask);
                setCode(fetchedTask.starterCode || "");
                setOutput("");
            } catch (error) {
                if (cancelled) return;

                console.error("Fetch Task Error:", error);

                setTaskError(
                    error.response?.data?.message ||
                    "Unable to load this programming task."
                );
            } finally {
                if (!cancelled) {
                    setTaskLoading(false);
                }
            }
        };

        if (!taskId) {
            setTaskError("No task ID was provided.");
            setTaskLoading(false);
        } else {
            fetchTask();
        }

        return () => {
            cancelled = true;
        };
    }, [taskId]);

    // Establish an authenticated Socket.IO connection.
    useEffect(() => {
        const token = localStorage.getItem("learnerToken");

        if (!token) {
            navigate("/login/learner");
            return;
        }

        const socket = io("http://localhost:5000", {
            auth: { token }
        });

        socketRef.current = socket;

        socket.on("connect_error", (err) => {
            console.error("Console connection error:", err.message);
            setIsRunning(false);
            setOutput(
                (previous) =>
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
            setOutput((previous) => `${previous}\n${message}\n`);
        });

        socket.on("python:finished", (result) => {
            setIsRunning(false);

            setOutput((previous) =>
                `${previous}\n${
                    result.success
                        ? "Process finished."
                        : "Process finished with an error."
                }`
            );
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [navigate]);

    // Keep the latest console output visible.
    useEffect(() => {
        if (consoleRef.current) {
            consoleRef.current.scrollTop =
                consoleRef.current.scrollHeight;
        }
    }, [output]);

    const handleRunCode = () => {
        if (!task || isRunning) return;

        const token = localStorage.getItem("learnerToken");
        const socket = socketRef.current;

        if (!token) {
            navigate("/login/learner");
            return;
        }

        if (!socket?.connected) {
            setOutput("Console is not connected. Please wait or refresh.");
            return;
        }

        setOutput("");
        setConsoleInput("");
        setIsRunning(true);

        socket.emit("python:start", {
            code,
            language: (task.language || "python").toLowerCase(),
            taskId: task._id,
            assessmentMode: "AI_ASSISTED"
        });
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
                assessmentMode: "AI_ASSISTED"
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


    // Send each entered line to the running Python process.
    const handleConsoleSubmit = (event) => {
        event.preventDefault();

        if (!isRunning) return;

        const socket = socketRef.current;

        if (!socket?.connected) return;

        const submittedInput = consoleInput;

        setOutput((previous) => previous + submittedInput + "\n");
        socket.emit("python:input", submittedInput);

        setConsoleInput("");
        inputRef.current?.focus();
    };

    const handleStopCode = () => {
        socketRef.current?.emit("python:stop");
        setIsRunning(false);
    };

    if (taskLoading) {
        return (
            <div className="coding-workspace-page">
                <div className="workspace-header">
                    <h1>Coding Workspace</h1>
                    <p>Loading task details...</p>
                </div>
            </div>
        );
    }

    if (taskError || !task) {
        return (
            <div className="coding-workspace-page">
                <div className="workspace-header">
                    <h1>Unable to Load Task</h1>
                    <p>{taskError || "Task not found."}</p>
                    <button onClick={() => navigate("/learning")}>
                        Back to Learning
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="coding-workspace-page">
            <main>
                <BackButton fallback="/learning" />
            </main>

            <div className="workspace-header">
                <h1>Coding Workspace</h1>
                <p>Task ID: {task._id}</p>
            </div>

            <div className="workspace-container">
                <div className="problem-panel">
                    <h2>{task.title}</h2>

                    <div className="task-meta">
                        <span>{task.topic}</span>
                        <span>{task.difficulty}</span>
                        <span>{task.language}</span>
                    </div>

                    <h3>Problem Description</h3>
                    <p>{task.description}</p>

                    <h3>Example</h3>
                    <p>
                        <strong>Input:</strong>{" "}
                        {task.exampleInput || "Not provided"}
                    </p>

                    <p>
                        <strong>Expected Output:</strong>{" "}
                        {task.exampleOutput || "Not provided"}
                    </p>
                </div>

                <div className="editor-panel">
                    <h2>Code Editor</h2>

                    <Editor
                        height="400px"
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

                    <div className="editor-actions">
                        <button
                            type="button"
                            onClick={handleRunCode}
                            disabled={isRunning}
                        >
                            {isRunning ? "Running..." : "Run Code"}
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

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    `/no-ai-tasks?originalTaskId=${task._id}`
                                )
                            }
                        >
                            Continue to No-AI Assessment
                        </button>
                    </div>
                    
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
                            {result.passed ? "Passed" : "Failed"}
                        </li>
                    ))}
                </ul>
            </>
        )}
    </div>
)}

                </div>

                <AIAssistant
                    taskId={task._id}
                    taskTitle={task.title}
                    taskDescription={task.description}
                    code={code}
                />
            </div>

            <div className="output-panel no-ai-console">
                <h2>Program Console — AI-Assisted Mode</h2>

                <pre
                    ref={consoleRef}
                    className="no-ai-console-output"
                >
                    {output || "Run your program to see its output."}
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
                                ? "Type input and press Enter"
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
        </div>
    );
};

export default CodingWorkspace;
