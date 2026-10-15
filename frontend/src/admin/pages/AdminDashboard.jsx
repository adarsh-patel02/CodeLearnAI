
import { NavLink, useNavigate } from "react-router-dom";
import "../../styles/admin-dashboard.css";

const navigation = [
  { label: "Dashboard", icon: "▦", to: "/admin", end: true },
  { label: "Manage Tasks", icon: "☷", to: "/admin/tasks" },
  { label: "Create Task", icon: "＋", to: "/admin/tasks/add" },
];

const overviewCards = [
  {
    label: "Total Tasks",
    value: "—",
    detail: "Tasks in the database",
    icon: "☷",
    tone: "indigo",
  },
  {
    label: "AI-Generated Tasks",
    value: "—",
    detail: "Requires generation metadata",
    icon: "✦",
    tone: "violet",
  },
  {
    label: "Learners",
    value: "—",
    detail: "Connect learner statistics",
    icon: "♙",
    tone: "cyan",
  },
  {
    label: "Assessments",
    value: "—",
    detail: "Connect assessment statistics",
    icon: "✓",
    tone: "green",
  },
];

export default function AdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    navigate("/login/admin", { replace: true });
  };

  return (
    <div className="admin-dashboard">
      <aside className="admin-dashboard-sidebar">
        <div className="admin-dashboard-brand">
          <div className="admin-brand-mark">C</div>
          <div>
            <h2>CodeLearn AI</h2>
            <span>ADMINISTRATION</span>
          </div>
        </div>

        <div className="admin-nav-heading">WORKSPACE</div>

        <nav className="admin-dashboard-nav">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? "active" : ""}`
              }
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.label === "Create Task" && (
                <span className="admin-nav-plus">+</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-sidebar-note">
            <span className="admin-note-icon">✦</span>
            <strong>AI Task Studio</strong>
            <p>Build programming tasks with AI assistance.</p>
            <button onClick={() => navigate("/admin/tasks/add")}>
              Open task studio →
            </button>
          </div>

          <button
            type="button"
            className="admin-logout-button"
            onClick={handleLogout}
          >
            <span>↪</span> Logout
          </button>
        </div>
      </aside>

      <main className="admin-dashboard-main">
        <header className="admin-dashboard-topbar">
          <div>
            <span className="admin-breadcrumb">
              Administration / <strong>Dashboard</strong>
            </span>
          </div>
          <div className="admin-topbar-profile">
            <div className="admin-status-indicator" />
            <span>Admin workspace</span>
            <div className="admin-profile-avatar">A</div>
          </div>
        </header>

        <div className="admin-dashboard-content">
          <section className="admin-dashboard-welcome">
            <div className="admin-welcome-content">
              <span className="admin-eyebrow">
                <span className="admin-eyebrow-dot" />
                CONTROL CENTRE
              </span>

              <h1>Welcome to your workspace.</h1>

              <p>
                Manage programming tasks, create AI-assisted challenges,
                and maintain the learning platform from one place.
              </p>

              <div className="admin-welcome-actions">
                <button
                  type="button"
                  className="admin-primary-action"
                  onClick={() => navigate("/admin/tasks/add")}
                >
                  <span>＋</span> Create New Task
                </button>

                <button
                  type="button"
                  className="admin-secondary-action"
                  onClick={() => navigate("/admin/tasks")}
                >
                  Manage Task Bank <span>→</span>
                </button>
              </div>
            </div>

            <div className="admin-welcome-visual" aria-hidden="true">
              <div className="admin-visual-ring ring-one" />
              <div className="admin-visual-ring ring-two" />
              <div className="admin-visual-core">
                <span>{"</>"}</span>
              </div>
              <div className="admin-floating-chip chip-one">AI</div>
              <div className="admin-floating-chip chip-two">{"{ }"}</div>
              <div className="admin-floating-chip chip-three">✓</div>
            </div>
          </section>

          <section className="admin-dashboard-section">
            <div className="admin-section-heading">
              <div>
                <h2>Platform overview</h2>
                <p>Key metrics will appear when connected to your APIs.</p>
              </div>
              <span className="admin-data-status">
                <span /> Awaiting live data
              </span>
            </div>

            <div className="admin-overview-grid">
              {overviewCards.map((card) => (
                <article
                  className="admin-overview-card"
                  key={card.label}
                >
                  <div className="admin-overview-card-top">
                    <div className={`admin-overview-icon ${card.tone}`}>
                      {card.icon}
                    </div>
                    <span className="admin-metric-indicator">OVERVIEW</span>
                  </div>

                  <h3>{card.label}</h3>
                  <div className="admin-metric-value">{card.value}</div>
                  <p>{card.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="admin-dashboard-section">
            <div className="admin-section-heading">
              <div>
                <h2>Quick actions</h2>
                <p>Jump straight into your most-used tools.</p>
              </div>
            </div>

            <div className="admin-quick-actions">
              <button
                type="button"
                className="admin-action-card"
                onClick={() => navigate("/admin/tasks/add")}
              >
                <span className="admin-action-icon action-indigo">＋</span>
                <span className="admin-action-copy">
                  <strong>Create a task</strong>
                  <small>Add a programming challenge to the platform.</small>
                  <b>Get started →</b>
                </span>
                <span className="admin-action-arrow">↗</span>
              </button>

              <button
                type="button"
                className="admin-action-card"
                onClick={() => navigate("/admin/tasks")}
              >
                <span className="admin-action-icon action-cyan">☷</span>
                <span className="admin-action-copy">
                  <strong>Manage task bank</strong>
                  <small>Review, edit, and remove existing tasks.</small>
                  <b>View tasks →</b>
                </span>
                <span className="admin-action-arrow">↗</span>
              </button>

              <button
                type="button"
                className="admin-action-card"
                onClick={() => navigate("/admin/tasks/add")}
              >
                <span className="admin-action-icon action-violet">✦</span>
                <span className="admin-action-copy">
                  <strong>Generate with AI</strong>
                  <small>Open the existing task creation workflow.</small>
                  <b>Open generator →</b>
                </span>
                <span className="admin-action-arrow">↗</span>
              </button>
            </div>
          </section>

          <section className="admin-dashboard-section admin-roadmap-section">
            <div className="admin-section-heading">
              <div>
                <h2>Platform modules</h2>
                <p>Current tools and potential next steps.</p>
              </div>
            </div>

            <div className="admin-module-list">
              <div className="admin-module-row">
                <span className="admin-module-symbol">01</span>
                <div>
                  <strong>Programming task management</strong>
                  <p>Create, review, update, and delete tasks.</p>
                </div>
                <span className="admin-module-tag available">Existing module</span>
              </div>

              <div className="admin-module-row">
                <span className="admin-module-symbol">02</span>
                <div>
                  <strong>AI task generation</strong>
                  <p>Use your current task-generation workflow.</p>
                </div>
                <span className="admin-module-tag available">Existing workflow</span>
              </div>

              <div className="admin-module-row">
                <span className="admin-module-symbol">03</span>
                <div>
                  <strong>Learner analytics</strong>
                  <p>Plan learner activity and task-performance reporting.</p>
                </div>
                <span className="admin-module-tag planned">Future enhancement</span>
              </div>

              <div className="admin-module-row">
                <span className="admin-module-symbol">04</span>
                <div>
                  <strong>Research insights</strong>
                  <p>Plan AI-assistance and independent-competency analysis.</p>
                </div>
                <span className="admin-module-tag planned">Future enhancement</span>
              </div>
            </div>
          </section>

          <footer className="admin-dashboard-footer">
            <span>CodeLearn AI</span>
            <span>Programming · AI assistance · Independent learning</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
