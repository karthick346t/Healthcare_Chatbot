import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Chatbot from "./components/Chatbot";
import WorkInProgress from "./pages/WorkInProgress";
import Appointments from "./pages/Appointments";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";

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
            path="/chat"
            element={
              <ProtectedRoute>
                <Chatbot />
              </ProtectedRoute>
            }
          />
          <Route
            path="/symptoms"
            element={
              <ProtectedRoute>
                <WorkInProgress title="Symptom Checker" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/labs"
            element={
              <ProtectedRoute>
                <WorkInProgress title="Lab Reports" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medications"
            element={
              <ProtectedRoute>
                <WorkInProgress title="Medication Tracker" />
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
        </Routes>
      </div>
    </Router>
  );
}

export default InnerApp;