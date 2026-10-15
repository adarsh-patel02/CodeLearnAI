import { useEffect, useState } from "react";
import axios from "axios";
import TaskCard from "./TaskCard";

const TaskGrid = ({ search, topic, difficulty, mode = "learning" }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await axios.get(
                    "http://localhost:5000/api/tasks"
                );

                setTasks(response.data.tasks || []);
            } catch (err) {
                console.error("Fetch Tasks Error:", err);

                setError(
                    err.response?.data?.message ||
                    "Unable to load programming tasks."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, []);

    const filteredTasks = tasks.filter((task) => {
        const matchesSearch =
            !search ||
            task.title?.toLowerCase().includes(search.toLowerCase()) ||
            task.description?.toLowerCase().includes(search.toLowerCase());

        const normalize = (value) =>
            String(value || "")
                .trim()
                .toLowerCase()
                .replace(/[\s_-]+/g, "");

        const matchesTopic =
            !topic || normalize(task.topic) === normalize(topic);

        const matchesDifficulty =
            !difficulty ||
            normalize(task.difficulty) === normalize(difficulty);

        return matchesSearch && matchesTopic && matchesDifficulty;
    });

    if (loading) {
        return <p>Loading programming tasks...</p>;
    }

    if (error) {
        return <p className="admin-error-message">{error}</p>;
    }

    if (tasks.length === 0) {
        return (
            <div className="admin-tasks-state">
                <h2>No programming tasks yet</h2>
                <p>New tasks will appear here when they are added.</p>
            </div>
        );
    }

    if (filteredTasks.length === 0) {
        return (
            <div className="admin-tasks-state">
                <h2>No matching tasks found</h2>
                <p>Try changing your search, topic, or difficulty.</p>
            </div>
        );
    }

    return (
        <div className="task-grid">
            {filteredTasks.map((task) => (
                <TaskCard
                    key={task._id}
                    id={task._id}
                    title={task.title}
                    description={task.description}
                    difficulty={task.difficulty}
                    mode={mode}
                />
            ))}
        </div>
    );
};

export default TaskGrid;
