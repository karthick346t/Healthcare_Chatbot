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
import AdminProfile from "./pages/admin/AdminProfile";

function InnerApp() {
  return (
    <Router>
      <div className="min-h-screen font-sans text-neutral-dark relative bg-[#eef2f5]">
        {/* Universal Background Ambience */}
        <div className="fixed top-[-20%] left-[-10%] w-[50vw] h-[50vh] rounded-full bg-gradient-to-br from-cyan-400/20 to-teal-300/20 blur-[120px] pointer-events-none z-0" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vh] rounded-full bg-gradient-to-tl from-blue-500/20 to-indigo-400/20 blur-[100px] pointer-events-none z-0" />
        
        <div className="relative z-10 w-full h-full">
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
            path="/vitals"
            element={
              <ProtectedRoute>
                <WorkInProgress title="My Vitals" />
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
                    <Route path="profile" element={<AdminProfile />} />
                  </Routes>
                </AdminLayout>
              </AdminRoute>
            }
          />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default InnerApp;