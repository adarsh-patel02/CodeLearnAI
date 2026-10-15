
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "../styles/learner-dashboard.css";

const LearnerDashboard = () => {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const learner = JSON.parse(
        localStorage.getItem("learner") || "null"
    );

    const learnerName = learner?.name?.trim().split(/\s+/)[0] || "Learner";

    const handleLogout = () => {
        localStorage.removeItem("learnerToken");
        localStorage.removeItem("learner");
        navigate("/login/learner", { replace: true });
    };

    return (
        <div className="learner-dashboard">
            {sidebarOpen && (
                <button
                    className="learner-sidebar-overlay"
                    aria-label="Close navigation"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside className={`learner-sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
                <div className="learner-brand">
                    <div className="learner-brand-icon">C</div>
                    <div>
                        <h2>CodeLearn AI</h2>
                        <span>LEARNER PORTAL</span>
                    </div>
                </div>

                <p className="learner-nav-label">WORKSPACE</p>

                <nav className="learner-nav">
                    <button className="learner-nav-item active">
                        <span>▦</span> Dashboard
                    </button>

                    <button
                        className="learner-nav-item"
                        onClick={() => navigate("/learning/tasks")}
                    >
                        <span>▤</span> Learning Tasks
                    </button>

                    <button
                        className="learner-nav-item"
                        onClick={() => navigate("/learning/tasks")}
                    >
                        <span>⌘</span> AI-Assisted Coding
                    </button>

                    <button
                        className="learner-nav-item"
                        onClick={() => navigate("/learning/tasks")}
                    >
                        <span>〈/〉</span> No-AI Assessments
                    </button>
                </nav>

                <div className="learner-sidebar-bottom">
                    <div className="learner-profile">
                        <div className="learner-avatar">
                            {learnerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="learner-profile-info">
                            <strong>{learnerName}</strong>
                            <span>Programming Learner</span>
                        </div>
                    </div>

                    <button
                        className="learner-nav-item learner-logout"
                        onClick={handleLogout}
                    >
                        <span>↪</span> Log out
                    </button>
                </div>
            </aside>

            <main className="learner-main">
                <header className="learner-topbar">
                    <button
                        className="learner-menu-toggle"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        aria-label="Toggle navigation"
                    >
                        ☰
                    </button>

                    <div className="learner-breadcrumb">
                        Workspace <span>/</span> Dashboard
                    </div>

                    <div className="learner-topbar-status">
                        <span className="learner-status-dot" />
                        Learning workspace
                    </div>
                </header>

                <div className="learner-dashboard-content">
                    <section className="learner-welcome">
                        <div>
                            <span className="learner-eyebrow">
                                YOUR LEARNING SPACE
                            </span>
                            <h1>Welcome back, {learnerName}!</h1>
                            <p>
                                Build your programming skills through
                                practice, AI assistance, and independent
                                assessments.
                            </p>

                            <button
                                className="learner-primary-button"
                                onClick={() => navigate("/learning/tasks")}
                            >
                                Explore Programming Tasks <span>→</span>
                            </button>
                        </div>

                        <div className="learner-welcome-art" aria-hidden="true">
                            <div className="learner-art-orbit">
                                <span>AI</span>
                                <span>{"</>"}</span>
                                <span>✓</span>
                            </div>
                            <div className="learner-art-core">{"{ }"}</div>
                        </div>
                    </section>

                    <section className="learner-section">
                        <div className="learner-section-heading">
                            <div>
                                <h2>Your learning overview</h2>
                                <p>
                                    Your activity and progress will appear here.
                                </p>
                            </div>
                            <span className="learner-data-badge">
                                Live data integration pending
                            </span>
                        </div>

                        <div className="learner-stats-grid">
                            <article className="learner-stat-card">
                                <div className="learner-stat-icon purple">▤</div>
                                <span>Tasks Completed</span>
                                <strong>—</strong>
                                <small>Awaiting task history</small>
                            </article>

                            <article className="learner-stat-card">
                                <div className="learner-stat-icon blue">⌘</div>
                                <span>Practice Sessions</span>
                                <strong>—</strong>
                                <small>Awaiting session data</small>
                            </article>

                            <article className="learner-stat-card">
                                <div className="learner-stat-icon green">✓</div>
                                <span>Assessment Score</span>
                                <strong>—</strong>
                                <small>Awaiting assessment results</small>
                            </article>

                            <article className="learner-stat-card">
                                <div className="learner-stat-icon orange">◎</div>
                                <span>Independent Progress</span>
                                <strong>—</strong>
                                <small>Awaiting No-AI assessments</small>
                            </article>
                        </div>
                    </section>

                    <section className="learner-section">
                        <div className="learner-section-heading">
                            <div>
                                <h2>Choose your learning mode</h2>
                                <p>
                                    Practice with AI, then challenge yourself
                                    independently.
                                </p>
                            </div>
                        </div>

                        <div className="learner-modes-grid">
                            <article className="learner-mode-card ai-mode">
                                <div className="learner-mode-icon">✳</div>
                                <span className="learner-mode-label">
                                    LEARN WITH GUIDANCE
                                </span>
                                <h3>AI-Assisted Learning</h3>
                                <p>
                                    Work on programming tasks, run code, and
                                    use AI assistance to understand concepts
                                    and debug problems.
                                </p>
                                <button
                                    onClick={() => navigate("/learning/tasks")}
                                >
                                    Browse learning tasks →
                                </button>
                            </article>

                            <article className="learner-mode-card independent-mode">
                                <div className="learner-mode-icon">{"</>"}</div>
                                <span className="learner-mode-label">
                                    TEST YOUR UNDERSTANDING
                                </span>
                                <h3>Independent Assessment</h3>
                                <p>
                                    Solve a matched programming problem
                                    without AI assistance to evaluate your
                                    independent understanding.
                                </p>
                                <button
                                    onClick={() => navigate("/learning/tasks")}
                                >
                                    Choose a task first →
                                </button>
                            </article>
                        </div>
                    </section>

                    <footer className="learner-footer">
                        CodeLearn AI <span>·</span> Learn, practice, understand.
                    </footer>
                </div>
            </main>
        </div>
    );
};

export default LearnerDashboard;
