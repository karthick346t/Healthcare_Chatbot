import React, { useEffect, useState } from "react";

const SESSION_KEY = "aura_disclaimer_accepted";

interface DisclaimerModalProps {
  onAccept: () => void;
}

export default function DisclaimerModal({ onAccept }: DisclaimerModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show once per browser session
    const accepted = sessionStorage.getItem(SESSION_KEY);
    if (!accepted) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    sessionStorage.setItem(SESSION_KEY, "true");
    setVisible(false);
    onAccept();
  };

  if (!visible) return null;

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal card */}
      <div
        className="relative z-10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-fadeIn"
        style={{
          background: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.5)",
        }}
      >
        {/* Gradient top accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500" />

        <div className="p-8">
          {/* Icon + Title */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mb-4 shadow-lg">
              <span className="text-3xl">🏥</span>
            </div>
            <h2 className="text-2xl font-bold text-neutral-800 tracking-tight">
              Medical Disclaimer
            </h2>
            <p className="text-sm text-neutral-500 mt-1">Please read before continuing</p>
          </div>

          {/* Content */}
          <div className="space-y-4 text-sm text-neutral-700 leading-relaxed">
            <div className="flex gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <span className="text-blue-500 text-lg mt-0.5 shrink-0">ℹ️</span>
              <p>
                <strong>AURA</strong> is an AI-powered health assistant designed to provide
                general health information and wellness guidance. It is{" "}
                <strong>not a licensed medical professional</strong>.
              </p>
            </div>

            <div className="flex gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
              <span className="text-amber-500 text-lg mt-0.5 shrink-0">⚠️</span>
              <p>
                Information provided by AURA should <strong>not</strong> be used as a
                substitute for professional medical advice, diagnosis, or treatment.
              </p>
            </div>

            <div className="flex gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
              <span className="text-red-500 text-lg mt-0.5 shrink-0">🚨</span>
              <p>
                <strong>In a medical emergency, call emergency services immediately.</strong>
                {" "}(India: <strong>112</strong> / Ambulance: <strong>108</strong>)
              </p>
            </div>

            <p className="text-xs text-neutral-400 text-center pt-2">
              By continuing, you acknowledge these limitations.
            </p>
          </div>

          {/* Accept button */}
          <button
            id="disclaimer-accept-btn"
            onClick={handleAccept}
            className="mt-6 w-full py-3.5 rounded-2xl font-semibold text-white text-base tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-cyan-200"
            style={{
              background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
            }}
          >
            I Understand — Continue to AURA
          </button>
        </div>
      </div>
    </div>
  );
}
