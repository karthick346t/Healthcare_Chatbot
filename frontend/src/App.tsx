import { useContext } from "react";
import Header from "./components/Header";
import EmergencyBanner from "./components/EmergencyBanner";
import LanguageSelector from "./components/Home"; // This imports your Home component
import Chatbot from "./components/Chatbot";
import { LanguageContext } from "./context/LanguageContext";

function InnerApp() {
  const { isChatOpen, setChatOpen } = useContext(LanguageContext);

  return (
    <div className="min-h-screen font-sans flex flex-col text-neutral-dark relative bg-gradient-to-br from-primary-light to-secondary-light">
      <Header />

      <div className="border-b border-critical/20 bg-critical/10">
        <EmergencyBanner />
      </div>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-5xl mx-auto">
          {/* Main Content (Home Screen) */}
          <LanguageSelector onStartChat={() => setChatOpen(true)} />
        </div>
      </main>

      {/* --- Floating Action Button (Visible only when chat is CLOSED) --- */}
      {!isChatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 btn-primary rounded-full p-4 shadow-xl z-50 hover-lift animate-fadeIn"
          aria-label="Open Chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      )}

      {/* --- Chatbot Modal Wrapper (Visible only when chat is OPEN) --- */}
      {isChatOpen && (
        <div className="fixed inset-0 z-[100] w-full h-full bg-black/40 flex items-center justify-center animate-fadeIn">
          <div className="relative w-full h-full">
            {/* External Close Button */}
            <button
              onClick={() => setChatOpen(false)}
              className="absolute top-6 right-6 bg-white text-neutral-medium hover:text-critical border border-neutral-200 hover:border-critical/30 rounded-full p-1.5 shadow-lg z-50 transition-colors"
              aria-label="Close Chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* The Chatbot Component */}
            <div className="w-full h-full rounded-none overflow-hidden border border-primary/20 bg-white">
              <Chatbot />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InnerApp;