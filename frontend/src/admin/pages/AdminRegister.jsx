
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/auth.css";

const AdminRegister = () => {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [reason, setReason] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        // Admin registration and approval API will be connected next.
        setError("Admin access request API is not connected yet.");
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <button
                    type="button"
                    className="auth-back"
                    onClick={() => navigate("/login/admin")}
                >
                    ← Back to Admin Login
                </button>

                <div className="auth-brand">
                    <div className="auth-logo admin-logo">A</div>
                    <h2>CodeLearn AI</h2>
                </div>

                <div className="auth-heading">
                    <span className="auth-label admin-label">
                        ADMIN REGISTRATION
                    </span>
                    <h1>Request admin access</h1>
                    <p>
                        Submit your details for administrator access review.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="admin-register-name">Full Name</label>
                    <input
                        id="admin-register-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />

                    <label htmlFor="admin-register-email">Email Address</label>
                    <input
                        id="admin-register-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <label htmlFor="admin-register-password">Password</label>
                    <input
                        id="admin-register-password"
                        type="password"
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={8}
                        required
                    />

                    <label htmlFor="admin-confirm-password">
                        Confirm Password
                    </label>
                    <input
                        id="admin-confirm-password"
                        type="password"
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        minLength={8}
                        required
                    />

                    <label htmlFor="admin-access-reason">
                        Reason for requesting access
                    </label>
                    <textarea
                        id="admin-access-reason"
                        placeholder="Explain why you need admin access"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        required
                    />

                    {error && (
                        <p className="auth-error" role="alert">
                            {error}
                        </p>
                    )}

                    <button
                        className="auth-submit admin-submit"
                        type="submit"
                    >
                        Submit Access Request
                    </button>
                </form>

                <div className="auth-register">
                    <span>Already authorized?</span>
                    <button
                        type="button"
                        onClick={() => navigate("/login/admin")}
                    >
                        Admin Sign In
                    </button>
                </div>

                <p className="auth-note">
                    Submitting this form does not grant administrator access.
                </p>
            </div>
        </div>
    );
};

export default AdminRegister;
