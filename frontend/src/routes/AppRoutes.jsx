import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import LearnerLogin from "../pages/LearnerLogin";
import AdminLogin from "../admin/pages/AdminLogin";
import LearnerRegister from "../pages/LearnerRegister";
import AdminRegister from "../admin/pages/AdminRegister";
import LearnerDashboard from "../pages/LearnerDashboard";
import AdminRoutes from "../admin/routes/AdminRoutes";


import Learning from "../pages/learning";
import TaskDetails from "../pages/TaskDetails";
import CodingWorkspace from "../pages/CodingWorkspace";
import NoAITasks from "../pages/NoAITasks";
import NoAIWorkspace from "../pages/NoAIWorkspace";


const AppRoutes = () => {
    return (
        <Routes>
            {/* Home and login */}
            <Route path="/" element={<Home />} />
            <Route
                path="/login/learner"
                element={<LearnerLogin />}
            />
            <Route
                path="/login/admin"
                element={<AdminLogin />}
            />
            <Route
                path="/register/learner"
                element={<LearnerRegister />}
            />

            <Route
                path="/register/admin"
                element={<AdminRegister />}
            />
            <Route path="/admin/*" element={<AdminRoutes />} />

            {/* Existing learning workflow */}
            <Route path="/learning" element={<LearnerDashboard />} />
            
            
            <Route path="/learning/tasks" element={<Learning />} />
            <Route path="/task/:taskId" element={<TaskDetails />} />
            <Route path="/coding/:taskId" element={<CodingWorkspace />} />
            <Route path="/no-ai-tasks" element={<NoAITasks />} />
            <Route
                path="/no-ai/:taskId"
                element={<NoAIWorkspace />}
            />
        </Routes>
    );
};

export default AppRoutes;
