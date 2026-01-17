import { useContext } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; // 1. Import Router components
import Dashboard from "./components/Dashboard";
import Chatbot from "./components/Chatbot";
import WorkInProgress from "./pages/WorkInProgress"; // 2. Import your placeholder page
import { LanguageContext } from "./context/LanguageContext";

function InnerApp() {
  const { isChatOpen, setChatOpen } = useContext(LanguageContext);

  return (
    // 3. Wrap everything in Router so 'useNavigate' inside Dashboard works
    <Router>
      <div className="min-h-screen font-sans text-neutral-dark relative">
        
        {/* 4. Define your Routes */}
        <Routes>
          {/* Home Route - The Main Dashboard */}
          <Route 
            path="/" 
            element={<Dashboard onStartChat={() => setChatOpen(true)} />} 
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
            element={<WorkInProgress title="Book Appointment" />} 
          />
        </Routes>

        {/* 5. THE CHAT OVERLAY LAYER 
           This sits outside Routes so it can overlay on top of any page if needed,
           though typically triggered from Dashboard.
        */}
        {isChatOpen && (
          <div className="fixed inset-0 z-[100] w-full h-full bg-black/40 backdrop-blur-sm flex items-center justify-center animate-fadeIn">
            <div className="relative w-full h-full md:w-[90%] md:h-[90%] lg:w-[1000px] lg:h-[700px]">
              
              {/* Close Button */}
              <button
                onClick={() => setChatOpen(false)}
                className="absolute -top-10 right-0 md:-right-10 text-white hover:text-primary-lighter transition-colors"
                aria-label="Close Chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              {/* The Existing Chatbot Component */}
              <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-white">
                <Chatbot />
              </div>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
}

export default InnerApp;