import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const ManageTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const location = useLocation();
    const navigate = useNavigate();
    const successMessage = location.state?.message;

    const fetchTasks = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                "http://localhost:5000/api/tasks"
            );

            if (response.data.success) {
                setTasks(response.data.tasks);
            }
        } catch (err) {
            console.error("Fetch Tasks Error:", err);
            setError(
                err.response?.data?.message ||
                "Unable to load tasks. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);


    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this task?"
        );

        if (!confirmed) return;

        try {
            await axios.delete(
                `http://localhost:5000/api/tasks/${id}`
            );

            setTasks((prevTasks) =>
                prevTasks.filter((task) => task._id !== id)
            );
        } catch (error) {
            console.error("Delete Task Error:", error);

            setError(
                error.response?.data?.message ||
                "Failed to delete task. Please try again."
            );
        }
    };




    return (
        <div className="admin-manage-tasks-page">

            <div className="admin-page-header">
                <div>
                    <h1>Manage Tasks</h1>
                    <p>View and manage programming tasks stored in MongoDB.</p>
                </div>

                <button
                    type="button"
                    className="admin-create-button"
                    onClick={() => navigate("/admin/tasks/add")}
                >
                    + Create New Task
                </button>
            </div>


            {
                successMessage && (
                    <p className="admin-success-message">
                        {successMessage}
                    </p>
                )
            }

            <div className="admin-tasks-summary">
                <div className="admin-task-stat">
                    <span>Total Tasks</span>
                    <strong>{tasks.length}</strong>
                </div>
            </div>

            {loading ? (
                <div className="admin-tasks-state">
                    Loading tasks...
                </div>
            ) : error ? (
                <div className="admin-error-message">
                    {error}
                    <button onClick={fetchTasks}>
                        Try Again
                    </button>
                </div>
            ) : tasks.length === 0 ? (
                <div className="admin-tasks-state">
                    <h2>No tasks found</h2>
                    <p>Add a task first to see it here.</p>
                </div>
            ) : (
                <div className="admin-tasks-list">
                    {tasks.map((task) => (

                        <article className="admin-task-item" key={task._id}>
                            <div className="admin-task-info">
                                <h2>{task.title}</h2>
                                <p>{task.description}</p>

                                <div className="admin-task-meta">
                                    <span>{task.difficulty}</span>
                                    <span>{task.language}</span>
                                    <span>{task.topic}</span>
                                </div>
                            </div>

                            <div className="admin-task-actions">
                                <button
                                    type="button"
                                    className="admin-edit-button"
                                    onClick={() =>
                                        window.location.assign(
                                            `/admin/tasks/add?id=${task._id}`
                                        )
                                    }
                                >
                                    Edit Task
                                </button>

                                <button
                                    type="button"
                                    className="admin-delete-button"
                                    onClick={() => handleDelete(task._id)}
                                >
                                    Delete Task
                                </button>
                            </div>
                        </article>

                    ))}
                </div>
            )}
        </div>
    );
};

export default ManageTasks;
