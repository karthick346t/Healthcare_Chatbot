import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Chatbot from "./components/Chatbot";
import WorkInProgress from "./pages/WorkInProgress";
import Appointments from "./pages/Appointments";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Telemedicine from "./pages/Telemedicine";
import Payment from "./pages/Payment";
import MedicalRecords from './pages/MedicalRecords';
import MyAppointments from "./pages/MyAppointments";
import LabReports from "./pages/LabReports";
import Medications from "./pages/Medications";
import Settings from "./pages/Settings";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./components/AdminLayout";
import AdminAppointments from "./pages/admin/AdminAppointments";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminDoctors from "./pages/admin/AdminDoctors";
import AdminSettings from "./pages/admin/AdminSettings";

function InnerApp() {
  return (
    <Router>
      <div className="min-h-screen font-sans text-neutral-dark relative">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/telemedicine"
            element={
              <ProtectedRoute>
                <Telemedicine />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment"
            element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/records"
            element={
              <ProtectedRoute>
                <MedicalRecords />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chatbot />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-appointments"
            element={
              <ProtectedRoute>
                <MyAppointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/labs"
            element={
              <ProtectedRoute>
                <LabReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medications"
            element={
              <ProtectedRoute>
                <Medications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <Appointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <AdminLayout>
                  <Routes>
                    <Route index element={<AdminDashboard />} />
                    <Route path="appointments" element={<AdminAppointments />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="doctors" element={<AdminDoctors />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Routes>
                </AdminLayout>
              </AdminRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default InnerApp;