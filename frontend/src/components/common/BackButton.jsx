
import { useNavigate } from "react-router-dom";

export default function BackButton({ fallback = "/learning", label = "Back" }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <button
      type="button"
      className="learner-back-button"
      onClick={handleBack}
      aria-label={label}
    >
      <span aria-hidden="true">←</span>
      {label}
    </button>
  );
}
