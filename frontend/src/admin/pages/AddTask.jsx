import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5000/api/tasks";

const initialForm = {
    title: "",
    description: "",
    difficulty: "Easy",
    language: "python",
    topic: "",
    starterCode: "",
    evaluationType: "STDIN",
    functionName: "",
    exampleInput: "",
    exampleOutput: "",
    testCases: []
};

const AddTask = () => {
    const [formData, setFormData] = useState(initialForm);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [creationMode, setCreationMode] = useState("manual");
    const [aiTopic, setAiTopic] = useState("");
    const [aiDifficulty, setAiDifficulty] = useState("Easy");
    const [aiLanguage, setAiLanguage] = useState("python");
    const [aiCount, setAiCount] = useState(3);
    const [generating, setGenerating] = useState(false);
    const [generatedTasks, setGeneratedTasks] = useState([]);

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const taskId = searchParams.get("id");
    const isEditMode = Boolean(taskId);

    useEffect(() => {
        if (!taskId) {
            setFormData(initialForm);
            return;
        }

        const fetchTask = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await axios.get(
                    `${API_URL}/${taskId}`
                );

                const task = response.data.task;

                if (!task) {
                    setError("Task not found.");
                    return;
                }

                setFormData({
                    title: task.title || "",
                    description: task.description || "",
                    difficulty: task.difficulty || "Easy",
                    language: task.language || "python",
                    topic: task.topic || "",
                    starterCode: task.starterCode || "",
                    exampleInput: task.exampleInput || "",
                    exampleOutput: task.exampleOutput || "",
                    evaluationType: task.evaluationType || "STDIN",
                    functionName: task.functionName || "",
                    testCases: (task.testCases || []).map((test) => ({
                        input: test.input || "",
                        expectedOutput: test.expectedOutput || "",
                        isHidden: Boolean(test.isHidden)
                    }))
                });
            } catch (err) {
                console.error("Fetch Task Error:", err);
                setError(
                    err.response?.data?.message ||
                    "Unable to load task details."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchTask();
    }, [taskId]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const addTestCase = () => {
        setFormData((prev) => ({
            ...prev,
            testCases: [
                ...prev.testCases,
                {
                    input: "",
                    expectedOutput: "",
                    isHidden: false
                }
            ]
        }));
    };

    const updateTestCase = (index, field, value) => {
        setFormData((prev) => ({
            ...prev,
            testCases: prev.testCases.map((test, i) =>
                i === index
                    ? { ...test, [field]: value }
                    : test
            )
        }));
    };

    const removeTestCase = (index) => {
        setFormData((prev) => ({
            ...prev,
            testCases: prev.testCases.filter(
                (_, i) => i !== index
            )
        }));
    };



    const handleGenerateTasks = async () => {
        if (!aiTopic.trim()) {
            setError("Please enter a programming topic.");
            return;
        }

        setGenerating(true);
        setError("");
        setMessage("");

        try {
            const response = await axios.post(
                "http://localhost:5000/api/ai/generate-tasks",
                {
                    topic: aiTopic.trim(),
                    difficulty: aiDifficulty,
                    language: aiLanguage,
                    count: Number(aiCount)
                }
            );

            const tasks = response.data.tasks;

            if (
                !response.data.success ||
                !Array.isArray(tasks) ||
                tasks.length !== Number(aiCount)
            ) {
                throw new Error("AI returned an invalid task list.");
            }

            // Save the generated tasks using the existing task API.
            for (const task of tasks) {

                await axios.post(API_URL, {
                    ...task,
                    evaluationType: task.evaluationType || "STDIN",
                    functionName: task.functionName || "",
                    testCases: (task.testCases || []).map((test) => ({
                        input: test.input || "",
                        expectedOutput: test.expectedOutput || "",
                        isHidden: Boolean(test.isHidden)
                    }))
                });

            }

            setMessage(
                `${tasks.length} tasks generated and saved successfully!`
            );
        } catch (err) {
            console.error("AI Task Generation Error:", err);

            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to generate or save tasks."
            );
        } finally {
            setGenerating(false);
        }
    };



    const handleSubmit = async (event) => {
        event.preventDefault();

        setSaving(true);
        setMessage("");
        setError("");

        // Do not save incomplete test cases.
        const incompleteTestCase = formData.testCases.some(
            (test) => !test.expectedOutput.trim()
        );

        if (incompleteTestCase) {
            setError(
                "Please enter an expected output for every test case."
            );
            setSaving(false);
            return;
        }

        try {
            if (isEditMode) {
                await axios.put(
                    `${API_URL}/${taskId}`,
                    formData
                );

                navigate("/admin/tasks", {
                    state: {
                        message: "Task updated successfully!"
                    }
                });
            } else {
                await axios.post(API_URL, formData);

                setMessage("Task created successfully!");
                setFormData({
                    ...initialForm,
                    testCases: []
                });
            }
        } catch (err) {
            console.error("Save Task Error:", err);
            setError(
                err.response?.data?.message ||
                "Unable to save task. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-add-task-page">
                <p>Loading task details...</p>
            </div>
        );
    }

    return (
        <div className="admin-add-task-page">
            <div className="admin-page-header">
                <h1>{isEditMode ? "Edit Task" : "Add New Task"}</h1>
                <p>
                    {isEditMode
                        ? "Update the programming task details."
                        : "Create a new programming task for learners."}
                </p>
            </div>


            {!isEditMode && (
                <div className="admin-form-section">
                    <div className="admin-form-row">
                        <button
                            type="button"
                            className={
                                creationMode === "manual"
                                    ? "admin-create-task-button"
                                    : "admin-back-button"
                            }
                            onClick={() => {
                                setCreationMode("manual");
                                setError("");
                                setMessage("");
                            }}
                        >
                            Create Manually
                        </button>

                        <button
                            type="button"
                            className={
                                creationMode === "ai"
                                    ? "admin-create-task-button"
                                    : "admin-back-button"
                            }
                            onClick={() => {
                                setCreationMode("ai");
                                setError("");
                                setMessage("");
                            }}
                        >
                            Generate with AI
                        </button>
                    </div>
                </div>
            )}


            {creationMode === "manual" || isEditMode ? (
                <form
                    className="admin-task-form"
                    onSubmit={handleSubmit}
                >
                    <div className="admin-form-section">
                        <div className="admin-form-group">
                            <label htmlFor="title">Task Title</label>
                            <input
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="description">Description</label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                                required
                            />
                        </div>

                        <div className="admin-form-row">
                            <div className="admin-form-group">
                                <label htmlFor="difficulty">Difficulty</label>
                                <select
                                    id="difficulty"
                                    name="difficulty"
                                    value={formData.difficulty}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                </select>
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="language">Language</label>
                                <input
                                    id="language"
                                    name="language"
                                    value={formData.language}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="topic">Topic</label>
                            <input
                                id="topic"
                                name="topic"
                                value={formData.topic}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="admin-form-section">
                        <div className="admin-form-group">
                            <label htmlFor="starterCode">Starter Code</label>
                            <textarea
                                id="starterCode"
                                name="starterCode"
                                value={formData.starterCode}
                                onChange={handleChange}
                                rows="6"
                            />
                        </div>

                    
<div className="admin-form-group">
    <label htmlFor="evaluationType">
        Evaluation Format
    </label>

    <select
        id="evaluationType"
        name="evaluationType"
        value={formData.evaluationType}
        onChange={handleChange}
        required
    >
        <option value="STDIN">
            Standard Input / Output
        </option>
        <option value="FUNCTION">
            Function-Based
        </option>
                            </select>
                        </div>

                        {formData.evaluationType === "FUNCTION" && (
                            <div className="admin-form-group">
                                <label htmlFor="functionName">
                                    Function Name
                                </label>

                                <input
                                    id="functionName"
                                    name="functionName"
                                    value={formData.functionName}
                                    onChange={handleChange}
                                    placeholder="e.g. calculate_factorial"
                                    required
                                />

                                <p>
                                    The evaluator will call this function using
                                    the inputs configured in each test case.
                                </p>
                            </div>
                        )}


                        <div className="admin-form-row">
                            <div className="admin-form-group">
                                <label htmlFor="exampleInput">
                                    Example Input
                                </label>
                                <textarea
                                    id="exampleInput"
                                    name="exampleInput"
                                    value={formData.exampleInput}
                                    onChange={handleChange}
                                    rows="3"
                                />
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="exampleOutput">
                                    Example Output
                                </label>
                                <textarea
                                    id="exampleOutput"
                                    name="exampleOutput"
                                    value={formData.exampleOutput}
                                    onChange={handleChange}
                                    rows="3"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Test Cases */}
                    <div className="admin-form-section">
                        <div className="admin-page-header">
                            <h2>Test Cases</h2>
                            <p>
                                {formData.evaluationType === "FUNCTION"
                                    ? 'Use JSON inputs: [2,3] for two parameters, [1,2,3] for one list parameter. Use {"args":[],"kwargs":{}} for explicit arguments. Expected output is the returned value in JSON format.'
                                    : 'Enter the exact text read by the program. Put each separate input() value on a new line. Expected output must match printed output; omit input prompts.'}
                            </p>
                            <p>
                                Define the inputs and expected outputs
                                used to evaluate submitted programs.
                            </p>
                        </div>

                        {formData.testCases.map((test, index) => (
                            <div
                                className="admin-test-case-card"
                                key={index}
                            >
                                <div className="admin-form-group">
                                    <label>
                                        Test Case {index + 1} — Input
                                    </label>
                                    <textarea
                                        value={test.input}
                                        onChange={(event) =>
                                            updateTestCase(
                                                index,
                                                "input",
                                                event.target.value
                                            )
                                        }
                                        rows="2"
                                        placeholder="Example: 5 3"
                                    />
                                </div>

                                <div className="admin-form-group">
                                    <label>
                                        Expected Output
                                    </label>
                                    <textarea
                                        value={test.expectedOutput}
                                        onChange={(event) =>
                                            updateTestCase(
                                                index,
                                                "expectedOutput",
                                                event.target.value
                                            )
                                        }
                                        rows="2"
                                        placeholder="Example: 8"
                                        required
                                    />
                                </div>

                                <div className="admin-form-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={test.isHidden}
                                            onChange={(event) =>
                                                updateTestCase(
                                                    index,
                                                    "isHidden",
                                                    event.target.checked
                                                )
                                            }
                                        />
                                        {" "}Hidden test case
                                    </label>
                                </div>

                                <button
                                    type="button"
                                    className="admin-back-button"
                                    onClick={() => removeTestCase(index)}
                                >
                                    Remove Test Case
                                </button>
                            </div>
                        ))}

                        <button
                            type="button"
                            className="admin-create-task-button"
                            onClick={addTestCase}
                        >
                            + Add Test Case
                        </button>
                    </div>

                    {message && (
                        <p className="admin-success-message">
                            {message}
                        </p>
                    )}

                    {error && (
                        <p className="admin-error-message">
                            {error}
                        </p>
                    )}

                    <div className="admin-form-actions">
                        <button
                            type="button"
                            className="admin-back-button"
                            onClick={() => navigate("/admin/tasks")}
                        >
                            Back to Tasks
                        </button>

                        <button
                            type="submit"
                            className="admin-create-task-button"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : isEditMode
                                    ? "Update Task"
                                    : "Create Task"}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="admin-task-form">
                    <div className="admin-form-section">
                        <h2>Generate Programming Tasks with AI</h2>
                        <p>
                            Select your preferences to generate multiple
                            programming tasks for learners.
                        </p>

                        <div className="admin-form-group">
                            <label htmlFor="aiTopic">Programming Topic</label>
                            <input
                                id="aiTopic"
                                value={aiTopic}
                                onChange={(event) => setAiTopic(event.target.value)}
                                placeholder="e.g. Loops, Arrays, Functions"
                                required
                            />
                        </div>

                        <div className="admin-form-row">
                            <div className="admin-form-group">
                                <label htmlFor="aiDifficulty">Difficulty</label>
                                <select
                                    id="aiDifficulty"
                                    value={aiDifficulty}
                                    onChange={(event) =>
                                        setAiDifficulty(event.target.value)
                                    }
                                >
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                </select>
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="aiLanguage">Language</label>
                                <select
                                    id="aiLanguage"
                                    value={aiLanguage}
                                    onChange={(event) =>
                                        setAiLanguage(event.target.value)
                                    }
                                >
                                    <option value="python">Python</option>
                                    <option value="java">Java</option>
                                </select>
                            </div>
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="aiCount">Number of Tasks</label>
                            <select
                                id="aiCount"
                                value={aiCount}
                                onChange={(event) =>
                                    setAiCount(Number(event.target.value))
                                }
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((number) => (
                                    <option key={number} value={number}>
                                        {number} {number === 1 ? "Task" : "Tasks"}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {error && (
                        <p className="admin-error-message">{error}</p>
                    )}

                    {message && (
                        <p className="admin-success-message">{message}</p>
                    )}

                    <div className="admin-form-actions">
                        <button
                            type="button"
                            className="admin-back-button"
                            onClick={() => setCreationMode("manual")}
                        >
                            Back to Manual Form
                        </button>


                        <button
                            type="button"
                            onClick={() => navigate("/admin/tasks")}
                        >
                            Back to Tasks
                        </button>


                        <button
                            type="button"
                            className="admin-create-task-button"
                            onClick={handleGenerateTasks}
                            disabled={generating}
                        >
                            {generating ? "Generating..." : "Generate Tasks"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddTask;
