import { useContext } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; // 1. Import Router components
import Dashboard from "./components/Dashboard";
import Chatbot from "./components/Chatbot";
import WorkInProgress from "./pages/WorkInProgress";
import Appointments from "./pages/Appointments";
import { LanguageContext } from "./context/LanguageContext";

function InnerApp() {
  return (
    // 3. Wrap everything in Router so 'useNavigate' inside Dashboard works
    <Router>
      <div className="min-h-screen font-sans text-neutral-dark relative">

        {/* 4. Define your Routes */}
        <Routes>
          {/* Home Route - The Main Dashboard */}
          <Route
            path="/"
            element={<Dashboard />}
          />

          <Route
            path="/chat"
            element={<Chatbot />}
          />

          {/* New Feature Routes */}
          <Route
            path="/symptoms"
            element={<WorkInProgress title="Symptom Checker" />}
          />
          <Route
            path="/labs"
            element={<WorkInProgress title="Lab Reports" />}
          />
          <Route
            path="/medications"
            element={<WorkInProgress title="Medication Tracker" />}
          />
          <Route
            path="/appointments"
            element={<Appointments />}
          />
        </Routes>

      </div>
    </Router>
  );
}

export default InnerApp;