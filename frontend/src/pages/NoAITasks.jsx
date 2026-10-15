import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import TaskCard from "../features/learning/TaskCard";
import BackButton from "../components/common/BackButton";

const NoAITasks = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const originalTaskId = searchParams.get("originalTaskId");

    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchMatchedTask = async () => {
            if (!originalTaskId) {
                setError(
                    "Open this page from an AI-assisted task to find its matched assessment."
                );
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError("");
                setTask(null);


                const token = localStorage.getItem("learnerToken");

                if (!token) {
                    navigate("/login/learner");
                    return;
                }

                const response = await axios.get(
                    `http://localhost:5000/api/tasks/matched-no-ai/${originalTaskId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );


                setTask(response.data.task);
            } catch (err) {
                console.error("Fetch Matched Task Error:", err);

                setError(
                    err.response?.data?.message ||
                    "Unable to load a matched assessment task."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchMatchedTask();
    }, [originalTaskId]);

    return (
        <div className="learning-page">
            <main>
  <BackButton fallback="/learning" />
  {/* Existing learning page content */}
</main>
            <div className="learning-header">
                <h1>No-AI Assessment</h1>

                <p>
                    Solve a different programming problem independently.
                    The topic, difficulty, and language match your
                    AI-assisted task.
                </p>
            </div>

            <div className="learning-content">
                <h2>Matched Assessment Task</h2>

                {loading && (
                    <p>Finding a comparable assessment task...</p>
                )}

                {!loading && error && (
                    <div className="admin-tasks-state">
                        <h2>Assessment Task Unavailable</h2>
                        <p>{error}</p>

                        <button
                            type="button"
                            onClick={() => navigate("/learning")}
                        >
                            Back to Learning
                        </button>
                    </div>
                )}

                {!loading && !error && task && (
                    <>
                        <div className="task-grid">
                            <TaskCard
                                id={task._id}
                                title={task.title}
                                description={task.description}
                                difficulty={task.difficulty}
                                mode="no-ai"
                            />
                        </div>

                        <p className="no-ai-match-note">
                            Topic: {task.topic} | Difficulty:{" "}
                            {task.difficulty} | Language: {task.language}
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default NoAITasks;
