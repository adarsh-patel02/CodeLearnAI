import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import BackButton from "../components/common/BackButton";

const TaskDetails = () => {
    const { taskId } = useParams();
    const navigate = useNavigate();

    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchTask = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await axios.get(
                    `http://localhost:5000/api/tasks/${taskId}`
                );

                setTask(response.data.task);
            } catch (err) {
                console.error("Fetch Task Error:", err);

                setError(
                    err.response?.data?.message ||
                    "Unable to load this task."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchTask();
    }, [taskId]);

    if (loading) {
        return (
            <div className="task-details-page">
                <h1>Loading Task...</h1>
            </div>
        );
    }

    if (error || !task) {
        return (
            <div className="task-details-page">
                <h1>Task Not Found</h1>
                <p>{error || "The requested task does not exist."}</p>

                <button
                    className="start-task-button"
                    onClick={() => navigate("/learning")}
                >
                    Back to Learning
                </button>
            </div>
        );
    }

    const instructions = [
        `Use ${task.language || "Python"} to solve the problem.`,
        "Read the problem description carefully.",
        "Test your solution using the provided example."
    ];

    return (
        <div className="task-details-page">
             <main>
  <BackButton fallback="/learning" />
  {/* Existing learning page content */}
</main>

            {/* Task Header */}
            <div className="task-details-header">
                <h1>{task.title}</h1>

                <div className="task-meta">
                    <span>{task.topic}</span>
                    <span>{task.difficulty}</span>
                    <span>{task.language}</span>
                </div>
            </div>

            {/* Task Description */}
            <div className="task-details-content">

                <h2>Problem Description</h2>
                <p>{task.description}</p>

                <h2>Instructions</h2>
                <ul>
                    {instructions.map((instruction, index) => (
                        <li key={index}>{instruction}</li>
                    ))}
                </ul>

                <h2>Example</h2>

                <div className="example-box">
                    <p>
                        <strong>Input:</strong>{" "}
                        {task.exampleInput || "No example input provided"}
                    </p>

                    <p>
                        <strong>Output:</strong>{" "}
                        {task.exampleOutput || "No example output provided"}
                    </p>
                </div>

                <button
                    className="start-task-button"
                    onClick={() => navigate(`/coding/${task._id}`)}
                >
                    Start Coding
                </button>

            </div>
        </div>
    );
};

export default TaskDetails;
