
import { useNavigate } from "react-router-dom";
import "../styles/home.css";

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="home-page">
            <nav className="home-navbar">
                <div className="home-logo">
                    <span className="logo-icon">C</span>
                    <span>CodeLearn AI</span>
                </div>

                <button
                    className="home-nav-button"
                    onClick={() => navigate("/login/learner")}
                >
                    Get Started
                </button>
            </nav>

            <main className="home-hero">
                <div className="home-hero-content">
                    <span className="home-tag">
                        AI-POWERED PROGRAMMING LEARNING
                    </span>

                    <h1>
                        Learn to Code.
                        <br />
                        Think <span>Independently.</span>
                    </h1>

                    <p>
                        Practice programming with AI assistance, improve
                        your coding skills, and measure your independent
                        problem-solving ability.
                    </p>

                    <div className="home-actions">
                        <button
                            className="learner-button"
                            onClick={() => navigate("/login/learner")}
                        >
                            Learner Login →
                        </button>

                        <button
                            className="admin-button"
                            onClick={() => navigate("/login/admin")}
                        >
                            Admin Login
                        </button>
                    </div>

                    <div className="home-features">
                        <div>
                            <strong>01</strong>
                            <span>Learn Programming</span>
                        </div>
                        <div>
                            <strong>02</strong>
                            <span>Practice with AI</span>
                        </div>
                        <div>
                            <strong>03</strong>
                            <span>Assess Independently</span>
                        </div>
                    </div>
                </div>

                <div className="home-visual">
                    <div className="code-window">
                        <div className="code-window-header">
                            <div className="window-dots">
                                <i></i>
                                <i></i>
                                <i></i>
                            </div>
                            <span>practice.py</span>
                        </div>

                        <div className="code-window-body">
                            <p><span>01</span> <b>def</b> solve_problem():</p>
                            <p><span>02</span> &nbsp;&nbsp;problem = <em>"Learn"</em></p>
                            <p><span>03</span> &nbsp;&nbsp;practice = <b>True</b></p>
                            <p><span>04</span> &nbsp;&nbsp;<b>return</b> problem</p>
                            <p><span>05</span></p>
                            <p><span>06</span> <i># Think. Code. Improve.</i></p>
                        </div>

                        <div className="code-window-footer">
                            <span>● Python</span>
                            <span>CodeLearn AI</span>
                        </div>
                    </div>

                    <div className="home-floating-card">
                        <span className="floating-icon">✓</span>
                        <div>
                            <strong>Keep Learning</strong>
                            <p>Build skills through practice</p>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="home-footer">
                <span>CodeLearn AI</span>
                <span>Learn with AI. Grow independently.</span>
            </footer>
        </div>
    );
};

export default Home;
