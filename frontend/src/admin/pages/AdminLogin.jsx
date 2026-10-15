
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import "../../styles/auth.css";

const AdminLogin = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await axios.post(
                "http://localhost:5000/api/auth/admin/login",
                { email, password }
            );

            if (response.data.success && response.data.token) {
                localStorage.setItem(
                    "adminToken",
                    response.data.token
                );

                localStorage.setItem(
                    "admin",
                    JSON.stringify(response.data.admin)
                );

               navigate("/admin", { replace: true });
            } else {
                setError("Unable to sign in. Please try again.");
            }
        } catch (err) {
            console.error(
                "Admin login error:",
                err.response?.data || err.message
            );

            setError(
                err.response?.data?.message ||
                "Admin login failed. Please try again."
            );
        } finally {
            setLoading(false);
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
                    <div className="auth-logo admin-logo">A</div>
                    <h2>CodeLearn AI</h2>
                </div>

                <div className="auth-heading">
                    <span className="auth-label admin-label">
                        ADMIN PORTAL
                    </span>
                    <h1>Administrator Login</h1>
                    <p>Sign in to manage programming tasks and content.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="admin-email">Admin Email</label>
                    <input
                        id="admin-email"
                        type="email"
                        placeholder="Enter admin email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <label htmlFor="admin-password">Password</label>
                    <input
                        id="admin-password"
                        type="password"
                        placeholder="Enter admin password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    {error && (
                        <p role="alert" className="auth-error">
                            {error}
                        </p>
                    )}

                    <button
                        className="auth-submit admin-submit"
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Signing In..."
                            : "Sign In as Admin →"}
                    </button>
                </form>

                <div className="auth-register">
                    <span>Need an admin account?</span>
                    <button
                        type="button"
                        onClick={() => navigate("/register/admin")}
                    >
                        Request Admin Access
                    </button>
                </div>

                <p className="auth-note">
                    Authorized administrators only.
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;
