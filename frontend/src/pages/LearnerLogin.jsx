
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import "../styles/auth.css";

const LearnerLogin = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const response = await axios.post(
                "http://localhost:5000/api/auth/learner/login",
                {
                    email,
                    password
                }
            );

            if (response.data.success && response.data.token) {
                localStorage.setItem("learnerToken", response.data.token);
                localStorage.setItem(
                    "learner",
                    JSON.stringify(response.data.learner)
                );

                navigate("/learning");
            }
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Login failed. Please try again."
            );
        }
    };


    return (
        <div className="auth-page">
            <div className="auth-card">
                <button
                    className="auth-back"
                    onClick={() => navigate("/")}
                    type="button"
                >
                    ← Back to Home
                </button>

                <div className="auth-brand">
                    <div className="auth-logo">C</div>
                    <h2>CodeLearn AI</h2>
                </div>

                {location.state?.message && (
                    <p className="auth-success" role="status">
                        {location.state.message}
                    </p>
                )}

                <div className="auth-heading">
                    <span className="auth-label">LEARNER PORTAL</span>
                    <h1>Welcome back!</h1>
                    <p>Sign in to continue your programming journey.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="learner-email">Email Address</label>
                    <input
                        id="learner-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <label htmlFor="learner-password">Password</label>
                    <input
                        id="learner-password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    {error && (
                        <p className="auth-error" role="alert">
                            {error}
                        </p>
                    )}

                    <button className="auth-submit" type="submit">
                        Sign In as Learner →
                    </button>
                </form>


                <div className="auth-register">
                    <span>New to CodeLearn AI?</span>
                    <button
                        type="button"
                        onClick={() => navigate("/register/learner")}
                    >
                        Create Learner Account
                    </button>
                </div>


                <p className="auth-note">
                    Practice with AI. Develop independent coding skills.
                </p>
            </div>
        </div>
    );
};

export default LearnerLogin;
