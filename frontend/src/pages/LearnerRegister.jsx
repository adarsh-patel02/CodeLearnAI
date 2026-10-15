
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/auth.css";

const LearnerRegister = () => {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            const response = await axios.post(
                "http://localhost:5000/api/auth/learner/register",
                {
                    name,
                    email,
                    password
                }
            );

            if (response.data.success) {
                navigate("/login/learner", {
                    state: {
                        message: "Registration successful. Please sign in."
                    }
                });
            }
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Registration failed. Please try again."
            );
        }
    };


    return (
        <div className="auth-page">
            <div className="auth-card">
                <button
                    type="button"
                    className="auth-back"
                    onClick={() => navigate("/login/learner")}
                >
                    ← Back to Learner Login
                </button>

                <div className="auth-brand">
                    <div className="auth-logo">C</div>
                    <h2>CodeLearn AI</h2>
                </div>

                <div className="auth-heading">
                    <span className="auth-label">LEARNER REGISTRATION</span>
                    <h1>Create your account</h1>
                    <p>Join CodeLearn AI and start learning programming.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="learner-name">Full Name</label>
                    <input
                        id="learner-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />

                    <label htmlFor="register-learner-email">
                        Email Address
                    </label>
                    <input
                        id="register-learner-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <label htmlFor="register-learner-password">
                        Password
                    </label>
                    <input
                        id="register-learner-password"
                        type="password"
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={8}
                        required
                    />

                    <label htmlFor="confirm-learner-password">
                        Confirm Password
                    </label>
                    <input
                        id="confirm-learner-password"
                        type="password"
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        minLength={8}
                        required
                    />

                    {error && (
                        <p className="auth-error" role="alert">
                            {error}
                        </p>
                    )}

                    <button className="auth-submit" type="submit">
                        Create Learner Account
                    </button>
                </form>

                <div className="auth-register">
                    <span>Already have an account?</span>
                    <button
                        type="button"
                        onClick={() => navigate("/login/learner")}
                    >
                        Sign In
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LearnerRegister;
