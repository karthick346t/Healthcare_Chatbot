import { useContext } from "react";
// Remove Header and EmergencyBanner from here as they are now integrated into the Dashboard layout
// import Header from "./components/Header"; 
// import EmergencyBanner from "./components/EmergencyBanner";
import Dashboard from "./components/Dashboard"; // <--- IMPORT THE NEW DASHBOARD
import Chatbot from "./components/Chatbot";
import { LanguageContext } from "./context/LanguageContext";

function InnerApp() {
  const { isChatOpen, setChatOpen } = useContext(LanguageContext);

  return (
    <div className="min-h-screen font-sans text-neutral-dark relative">
      
      {/* 1. THE DASHBOARD LAYER 
        We pass the 'onStartChat' handler so clicking inputs in the dashboard opens the chat.
      */}
      <Dashboard onStartChat={() => setChatOpen(true)} />

      {/* 2. THE CHAT OVERLAY LAYER 
        When chat is open, we show the modal on top of the dashboard.
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
  );
}

export default InnerApp;