import React, { useState, useContext, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom"; // <--- 1. IMPORT THIS
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "../hooks/useAuth";
import {
  MdSearch,
  MdNotifications,
  MdMic,
  MdArrowForward
} from "react-icons/md";

import { LanguageContext } from "../context/LanguageContext";
import languages from "../locales/languages.json";
import i18n from "../utils/i18n";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

// --- COMPONENT: TYPEWRITER TEXT ---
const TypewriterText = () => {
  const texts = [
    "Type your symptoms here...",
    "Upload a lab report...",
    "Ask about side effects...",
    "Check your vitals...",
    "Connect with a doctor..."
  ];

  const [displayText, setDisplayText] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = texts[textIndex];
    const typingSpeed = isDeleting ? 50 : 100;

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setDisplayText(currentText.substring(0, charIndex + 1));
        setCharIndex((prev) => prev + 1);
        if (charIndex + 1 === currentText.length) {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        setDisplayText(currentText.substring(0, charIndex - 1));
        setCharIndex((prev) => prev - 1);
        if (charIndex - 1 === 0) {
          setIsDeleting(false);
          setTextIndex((prev) => (prev + 1) % texts.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, textIndex, texts]);

  return (
    <>
      {displayText}
      <span className="animate-pulse ml-0.5 font-light text-themeAccent-500">|</span>
    </>
  );
};




export default function Dashboard() {
  const { t } = useTranslation();
  const { selectedLanguage, setLanguage } = useContext(LanguageContext);
  const navigate = useNavigate(); // <--- 2. INITIALIZE HOOK
  const { user } = useAuth();

  const [showLangMenu, setShowLangMenu] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    } else if (user?.role === 'staff') {
      navigate('/staff', { replace: true });
    }
  }, [user, navigate]);

  const currentLang = languages.find((l) => l.code === selectedLanguage) || languages[0];

  function handleLanguageChange(code: string) {
    setLanguage(code);
    i18n.changeLanguage(code);
    setShowLangMenu(false);
  }

  const quickActions = [
    { title: "My Appointments", path: "/my-appointments", desc: "Manage visits", color: "from-blue-400 to-themeAccent-300", shadow: "shadow-blue-500/30", icon: "📅" },
    { title: "Medication", path: "/medications", desc: "Track your meds", color: "from-orange-400 to-red-400", shadow: "shadow-orange-500/30", icon: "💊" },
    { title: "Book Appointment", path: "/appointments", desc: "Schedule a visit", color: "from-emerald-400 to-teal-400", shadow: "shadow-emerald-500/30", icon: "📅" },
  ];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- PROJECT TOUR HOOK ---
  useEffect(() => {
    if (!user || user.role === 'admin' || user.role === 'staff') return;

    const tourKey = `tour_finished_${user.email}`;
    const hasSeenTour = localStorage.getItem(tourKey);

    if (!hasSeenTour) {
        const driverObj = driver({
            showProgress: true,
            popoverClass: 'driverjs-theme',
            steps: [
                { element: '#dashboard-welcome', popover: { title: 'Welcome to Healthcare Chatbot', description: 'This is your central command dashboard. Let\'s get you familiar with the key features!', side: "bottom", align: 'center' } },
                { element: '#chatbot-input', popover: { title: 'AI Health Assistant', description: 'Describe your symptoms, ask about medications, or inquire about side effects here. Our AI is ready 24/7.', side: "bottom", align: 'center' } },
                { element: '#quick-actions', popover: { title: 'Quick Access', description: 'Jump right into your Appointments or Medication Tracker with these shortcuts.', side: "top", align: 'center' } },
            ],
            onDestroyStarted: () => {
                localStorage.setItem(tourKey, 'true');
                const mainEl = document.querySelector('main');
                if (mainEl) {
                    mainEl.removeEventListener('scroll', handleScroll);
                }
                driverObj.destroy();
            },
        });

        const handleScroll = () => {
             window.dispatchEvent(new Event('resize'));
        };

        setTimeout(() => {
            driverObj.drive();
            const mainEl = document.querySelector('main');
            if (mainEl) {
                mainEl.addEventListener('scroll', handleScroll, { passive: true });
            }
        }, 800);
    }
}, [user]);

  return (
    <div className="flex w-full h-screen overflow-hidden bg-transparent text-neutral-dark font-sans relative selection:bg-primary/20">
      <Sidebar />

      <main className="flex-1 flex flex-col relative z-10 overflow-y-auto px-6 py-6">

        <Header />

        <div className="flex flex-col h-full">
          <div id="dashboard-welcome" className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-4xl font-bold text-neutral-800 dark:text-neutral-100 tracking-tight drop-shadow-sm">{t("Welcome, how can we help today?")}</h2>
              <p className="text-neutral-500 dark:text-neutral-400 mt-2 font-medium text-lg">{t("Ask HealthBot about your symptoms, medications, or lab reports.")}</p>
            </div>
            <button className="bg-gradient-to-r from-red-500 to-orange-500 hover:shadow-red-500/40 text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95 group border border-white/20">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white dark:bg-[#1f232b] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white dark:bg-[#1f232b]"></span>
              </span>
              <span className="font-bold text-sm tracking-wide">SOS: Emergency</span>
            </button>
          </div>

          <div className="flex flex-col gap-6 h-full pb-4">

            <div className="w-full flex flex-col gap-8">

              <div className="relative bg-neu dark:bg-neu-dark border-none rounded-3xl p-10 shadow-neu-out-lg dark:shadow-neu-out-lg-dark flex flex-col justify-center min-h-[280px] group transition-all overflow-hidden">
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-gradient-to-br from-themeAccent-400/20 to-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute top-8 right-10 animate-bounce" style={{ animationDuration: '3s' }}>
                  <div className="w-24 h-24 bg-gradient-to-b from-white to-blue-50 rounded-3xl flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/80 dark:border-white/5 transform rotate-6 hover:rotate-0 transition-all duration-500">
                    <span className="text-5xl drop-shadow-md">🤖</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-themeAccent-700 mb-4">
                  <div className="w-2 h-2 rounded-full bg-themeAccent-500 animate-pulse"></div>
                  <span className="font-bold uppercase tracking-widest text-xs opacity-80">Health Assistant</span>
                </div>
                <h3 className="text-3xl text-neutral-800 dark:text-neutral-100 mb-8 font-semibold max-w-md leading-tight">{t("greeting")}</h3>

                <div id="chatbot-input" onClick={() => navigate("/chat")} className="bg-neu dark:bg-neu-dark border-none rounded-2xl p-2 pl-6 flex items-center justify-between shadow-neu-in dark:shadow-neu-in-dark cursor-text transition-all duration-300 group/input">
                  <div className="flex items-center gap-6 text-neutral-400 text-sm font-medium w-full">
                    <span className="group-hover/input:text-neutral-600 dark:text-neutral-300 transition-colors min-w-[200px]">
                      <TypewriterText />
                    </span>
                  </div>
                  <button className="bg-gradient-to-r from-themeAccent-500 to-blue-500 text-white p-3.5 rounded-xl hover:shadow-lg hover:shadow-themeAccent-500/30 transition-all transform active:scale-95">
                    <MdArrowForward className="text-xl" />
                  </button>
                </div>
              </div>

              {/* === BOTTOM CARDS GRID (UPDATED) === */}
              <div id="quick-actions" className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {quickActions.map((card, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigate(card.path)} // <--- 4. NAVIGATE ON CLICK
                    className="bg-neu dark:bg-neu-dark border-none p-5 rounded-3xl text-left transition-all hover:-translate-y-1 shadow-neu-out dark:shadow-neu-out-dark flex flex-col justify-between h-44 group"
                  >
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-2xl text-white mb-2 ${card.shadow} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      {card.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-800 dark:text-neutral-100 text-sm mb-1">{t(card.title) || card.title}</h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">{card.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>



          </div>
        </div>
      </main>
    </div>
  );
}