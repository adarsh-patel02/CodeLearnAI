
import { useNavigate } from "react-router-dom";

const TaskCard = ({
    id,
    title,
    description,
    difficulty,
    mode = "learning"
}) => {
    const navigate = useNavigate();

    const handleStartTask = () => {
        if (mode === "no-ai") {
            navigate(`/no-ai/${id}`);
        } else {
            navigate(`/task/${id}`);
        }
    };

    return (
        <div className="task-card">
            <h3>{title}</h3>

            <p>{description}</p>

            <span>{difficulty}</span>

            <button onClick={handleStartTask}>
                {mode === "no-ai"
                    ? "Start Assessment"
                    : "Start Task"}
            </button>
        </div>
    );
};

export default TaskCard;
