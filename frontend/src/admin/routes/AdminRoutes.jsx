
import { Routes, Route, Navigate } from "react-router-dom";

import ManageTasks from "../pages/ManageTasks";
import AddTask from "../pages/AddTask";
import AdminDashboard from "../pages/AdminDashboard";

const AdminRoutes = () => {
  return (
    <Routes>
      <Route index element={<AdminDashboard />} />
      <Route path="tasks" element={<ManageTasks />} />
      <Route path="tasks/add" element={<AddTask />} />

      {/* Unknown admin URLs return to the dashboard */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};

export default AdminRoutes;
