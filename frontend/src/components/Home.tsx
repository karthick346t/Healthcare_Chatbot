import React from "react";
import { useTranslation } from "react-i18next";
import logo from "../assets/logo.png";

// Define the interface for the props
interface HomeProps {
  onStartChat?: () => void;
}

export default function LanguageSelector({ onStartChat }: HomeProps) {
  const { t } = useTranslation();

  return (
    <section
      aria-labelledby="healthbot-hero-title"
      className="w-full px-2 sm:px-4 py-6"
    >
      {/* Centered Hero Section */}
      <div className="flex flex-col items-center text-center mb-10 animate-fadeIn">
        
        {/* Logo Container with Teal Glow */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full opacity-60 animate-pulse" />
          <div className="relative h-20 w-20 rounded-2xl bg-white border border-primary/20 shadow-xl flex items-center justify-center overflow-hidden hover-lift">
            <img
              src={logo}
              alt={t("HealthBot logo")}
              className="h-full w-full object-contain p-2"
            />
          </div>
        </div>

        <h1
          id="healthbot-hero-title"
          className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 text-primary-darker"
        >
          {t("Welcome, how can we help today?")}
        </h1>

        <p className="text-base sm:text-lg text-neutral-medium max-w-2xl leading-relaxed">
          {t(
            "Ask HealthBot about your symptoms, medications, or lab reports. I’ll help you understand what might be going on and when to seek a doctor."
          )}
        </p>
      </div>

      {/* Main Card – “What you can ask” */}
      <div className="mx-auto max-w-4xl card glass p-6 sm:p-8 md:p-10 animate-slideInRight delay-150">
        <p className="text-xs uppercase tracking-wider text-primary font-bold mb-6 text-center">
          {t("Try asking about…")}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Example Item 1 */}
          <div className="rounded-xl border border-primary/10 bg-primary-light/40 px-5 py-4 text-left hover:bg-primary-light transition-colors cursor-default">
            <p className="text-xs font-bold text-primary mb-1">{t("Symptoms")}</p>
            <p className="text-sm text-neutral-dark font-medium">
              {t("“I have a headache and mild fever since yesterday.”")}
            </p>
          </div>

          {/* Example Item 2 */}
          <div className="rounded-xl border border-primary/10 bg-primary-light/40 px-5 py-4 text-left hover:bg-primary-light transition-colors cursor-default">
            <p className="text-xs font-bold text-primary mb-1">{t("Lab reports")}</p>
            <p className="text-sm text-neutral-dark font-medium">
              {t("“Can you help me understand my blood test results?”")}
            </p>
          </div>

          {/* Example Item 3 */}
          <div className="rounded-xl border border-primary/10 bg-primary-light/40 px-5 py-4 text-left hover:bg-primary-light transition-colors cursor-default">
            <p className="text-xs font-bold text-primary mb-1">{t("Medicines")}</p>
            <p className="text-sm text-neutral-dark font-medium">
              {t("“I missed a dose of my tablet, what should I do?”")}
            </p>
          </div>

          {/* Example Item 4 */}
          <div className="rounded-xl border border-primary/10 bg-primary-light/40 px-5 py-4 text-left hover:bg-primary-light transition-colors cursor-default">
            <p className="text-xs font-bold text-primary mb-1">{t("General health")}</p>
            <p className="text-sm text-neutral-dark font-medium">
              {t("“How can I improve my sleep and reduce stress?”")}
            </p>
          </div>
        </div>

        {/* Start Chat Button */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={onStartChat}
            className="btn-primary text-lg px-8 py-3 w-full sm:w-auto flex items-center justify-center gap-2"
            aria-label={t("Start chat")}
          >
            <span>{t("Start chat")}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          <p className="text-xs text-neutral-medium text-center max-w-sm">
            {t(
              "Click to start chatting. You can change the language inside the chat anytime."
            )}
          </p>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="mt-8 text-center text-[11px] text-neutral-medium/70 font-medium">
        ✨ {t("Secure")} • {t("Private")} • {t("Not a replacement for your doctor")}
      </div>
    </section>
  );
}