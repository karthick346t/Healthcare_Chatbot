import React, { useState, useContext, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next"; 
import Sidebar from "./Sidebar";
import { 
  MdSearch, 
  MdNotifications, 
  MdMic, 
  MdImage, 
  MdOutlineTextFormat,
  MdArrowForward
} from "react-icons/md";

import { LanguageContext } from "../context/LanguageContext";
import languages from "../locales/languages.json";
import i18n from "../utils/i18n";

// --- COMPONENTS: SMOOTH GRAPHS ---

const HeartRateGraph = () => (
  <svg viewBox="0 0 100 40" className="w-full h-20 overflow-visible">
    <defs>
      <linearGradient id="heartGradient" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
      </linearGradient>
    </defs>
    <path 
      d="M0 30 Q15 30 25 15 T40 25 T60 10 T80 25 T100 20 V40 H0 Z" 
      fill="url(#heartGradient)" 
    />
    <path 
      d="M0 30 Q15 30 25 15 T40 25 T60 10 T80 25 T100 20" 
      fill="none" 
      stroke="#ef4444" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

const OxygenGraph = () => (
  <svg viewBox="0 0 100 40" className="w-full h-20 overflow-visible">
    <defs>
      <linearGradient id="oxygenGradient" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
      </linearGradient>
    </defs>
    <path 
      d="M0 25 Q20 35 40 15 T80 25 T100 20 V40 H0 Z" 
      fill="url(#oxygenGradient)" 
    />
    <path 
      d="M0 25 Q20 35 40 15 T80 25 T100 20" 
      fill="none" 
      stroke="#14b8a6" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

interface DashboardProps {
  onStartChat: () => void;
}

export default function Dashboard({ onStartChat }: DashboardProps) {
  const { t } = useTranslation();
  const { selectedLanguage, setLanguage } = useContext(LanguageContext);
  
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find((l) => l.code === selectedLanguage) || languages[0];

  function handleLanguageChange(code: string) {
    setLanguage(code);
    i18n.changeLanguage(code);
    setShowLangMenu(false);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex w-full h-screen overflow-hidden bg-[#eef2f6] text-neutral-dark font-sans relative selection:bg-primary/20">
      
      {/* --- VIBRANT BACKGROUND BLOBS --- */}
      {/* Top Left - Cyan/Teal Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-cyan-400/20 to-teal-300/20 blur-[120px] pointer-events-none" />
      
      {/* Bottom Right - Blue/Purple Glow */}
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tl from-blue-500/20 to-indigo-400/20 blur-[100px] pointer-events-none" />

      {/* 1. Sidebar */}
      <Sidebar />

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col relative z-10 overflow-y-auto pl-2 pr-6 py-6">
        
        {/* --- Header --- */}
        <header className="flex items-center justify-between mb-8">
          {/* Search Bar */}
          <div className="flex items-center bg-white/60 border border-white/80 backdrop-blur-xl rounded-2xl px-5 py-3 w-1/3 shadow-sm text-neutral-500 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <MdSearch className="text-2xl mr-3 opacity-50" />
            <input 
              type="text" 
              placeholder={t("Search...") || "Search..."} 
              className="bg-transparent outline-none w-full text-sm font-medium placeholder-neutral-400 border-none p-0 focus:ring-0" 
            />
            <MdMic className="text-lg cursor-pointer hover:text-primary transition-colors ml-2 opacity-50 hover:opacity-100" />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-5">
            
            {/* Language Dropdown */}
            <div className="relative" ref={langMenuRef}>
                <button 
                    onClick={() => setShowLangMenu(!showLangMenu)}
                    className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/60 border border-white/80 text-xs font-bold text-neutral-600 shadow-sm cursor-pointer hover:bg-white/80 transition-all"
                >
                    <span className="text-base">{currentLang.emoji}</span>
                    <span>{currentLang.code.toUpperCase()}</span>
                </button>

                {showLangMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-xl border border-white/60 rounded-xl shadow-xl z-50 overflow-hidden animate-fadeIn">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`w-full text-left px-4 py-3 text-xs font-medium flex items-center gap-3 transition-colors ${
                            selectedLanguage === lang.code 
                            ? "bg-primary/10 text-primary" 
                            : "text-neutral-600 hover:bg-white/50"
                        }`}
                      >
                        <span className="text-lg">{lang.emoji}</span>
                        <span>{lang.native}</span>
                      </button>
                    ))}
                  </div>
                )}
            </div>

            <button className="relative p-2 rounded-xl hover:bg-white/40 transition-colors">
              <MdNotifications className="text-2xl text-neutral-600" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            
            {/* Profile Pic */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 p-[2px] cursor-pointer shadow-lg shadow-blue-500/20">
               <img src="https://i.pravatar.cc/150?img=5" alt="Profile" className="w-full h-full rounded-full border-2 border-white object-cover" />
            </div>
          </div>
        </header>

        {/* --- Dashboard Content --- */}
        <div className="flex flex-col h-full">
          
          {/* Greeting & SOS */}
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-4xl font-bold text-neutral-800 tracking-tight drop-shadow-sm">
                  {t("Welcome, how can we help today?")}
              </h2>
              <p className="text-neutral-500 mt-2 font-medium text-lg">
                  {t("Ask HealthBot about your symptoms, medications, or lab reports.")}
              </p>
            </div>
            
            <button className="bg-gradient-to-r from-red-500 to-orange-500 hover:shadow-red-500/40 text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95 group border border-white/20">
               <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
               <span className="font-bold text-sm tracking-wide">SOS: Emergency</span>
            </button>
          </div>

          <div className="flex flex-col xl:flex-row gap-6 h-full pb-4">
            
            {/* LEFT COLUMN: Chat Hub & Quick Cards */}
            <div className="flex-[2] flex flex-col gap-6">
              
              {/* === CHAT HUB HERO CARD === */}
              <div className="relative bg-white/40 border border-white/60 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 flex flex-col justify-center min-h-[280px] group transition-all hover:bg-white/50 overflow-hidden">
                
                {/* Decorative Glow inside card */}
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
                
                {/* 3D Bot Placeholder */}
                <div className="absolute top-8 right-10 animate-bounce" style={{ animationDuration: '3s' }}>
                   <div className="w-24 h-24 bg-gradient-to-b from-white to-blue-50 rounded-3xl flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/80 transform rotate-6 hover:rotate-0 transition-all duration-500">
                      <span className="text-5xl drop-shadow-md">🤖</span>
                   </div>
                </div>

                <div className="flex items-center gap-2 text-cyan-700 mb-4">
                   <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                   <span className="font-bold uppercase tracking-widest text-xs opacity-80">Health Assistant</span>
                </div>

                <h3 className="text-3xl text-neutral-800 mb-8 font-semibold max-w-md leading-tight">
                  {t("greeting")}
                </h3>

                {/* Main Input Trigger */}
                <div 
                   onClick={onStartChat}
                   className="bg-white border border-white/50 hover:border-cyan-500/30 rounded-2xl p-2 pl-6 flex items-center justify-between shadow-lg shadow-blue-900/5 cursor-text transition-all duration-300 group/input"
                >
                   <div className="flex items-center gap-6 text-neutral-400 text-sm font-medium w-full">
                      <span className="group-hover/input:text-neutral-600 transition-colors">Type your symptoms here...</span>
                      
                      {/* Icons */}
                      <div className="hidden sm:flex gap-4 border-l border-neutral-200 pl-4">
                        <div className="flex items-center gap-1 hover:text-cyan-600 cursor-pointer transition-colors p-1 rounded hover:bg-cyan-50">
                            <MdOutlineTextFormat className="text-lg" />
                            <span className="text-xs">Text</span>
                        </div>
                        <div className="flex items-center gap-1 hover:text-cyan-600 cursor-pointer transition-colors p-1 rounded hover:bg-cyan-50">
                            <MdMic className="text-lg" />
                            <span className="text-xs">Voice</span>
                        </div>
                        <div className="flex items-center gap-1 hover:text-cyan-600 cursor-pointer transition-colors p-1 rounded hover:bg-cyan-50">
                            <MdImage className="text-lg" />
                            <span className="text-xs">Image</span>
                        </div>
                      </div>
                   </div>

                   <button className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-3.5 rounded-xl hover:shadow-lg hover:shadow-cyan-500/30 transition-all transform active:scale-95">
                      <MdArrowForward className="text-xl" />
                   </button>
                </div>
              </div>

              {/* === BOTTOM CARDS GRID === */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {[
                   { title: "Symptom Checker", desc: "Check your symptoms", color: "from-blue-400 to-cyan-300", shadow: "shadow-blue-500/30", icon: "🩺" },
                   { title: "Lab Reports", desc: "Analyze reports", color: "from-purple-400 to-indigo-400", shadow: "shadow-purple-500/30", icon: "🧪" },
                   { title: "Medication", desc: "Track your meds", color: "from-orange-400 to-red-400", shadow: "shadow-orange-500/30", icon: "💊" },
                   { title: "Mental Health", desc: "Daily check-in", color: "from-emerald-400 to-teal-400", shadow: "shadow-emerald-500/30", icon: "🧠" },
                 ].map((card, idx) => (
                   <button 
                     key={idx}
                     onClick={onStartChat}
                     className="bg-white/60 border border-white/60 backdrop-blur-lg p-5 rounded-[1.5rem] text-left hover:bg-white/90 transition-all hover:-translate-y-1 hover:shadow-xl shadow-sm flex flex-col justify-between h-44 group"
                   >
                     <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-2xl text-white mb-2 ${card.shadow} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        {card.icon}
                     </div>
                     <div>
                        <h4 className="font-bold text-neutral-800 text-sm mb-1">{t(card.title) || card.title}</h4>
                        <p className="text-[11px] text-neutral-500 font-medium leading-relaxed">{card.desc}</p>
                     </div>
                   </button>
                 ))}
              </div>
            </div>

            {/* RIGHT COLUMN: Stats */}
            <div className="flex-1 xl:max-w-[320px] flex flex-col gap-5">
               
               {/* Heart Rate Card */}
               <div className="bg-white/50 border border-white/60 backdrop-blur-xl p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="flex justify-between items-center mb-6 relative z-10">
                     <span className="font-bold text-neutral-700 text-sm">Heart Rate</span>
                     <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                        <span className="text-xs">❤️</span>
                     </div>
                  </div>
                  
                  <div className="flex items-baseline gap-1 mb-2 relative z-10">
                      <span className="text-4xl font-bold text-neutral-800">98</span>
                      <span className="text-sm font-medium text-neutral-500">bpm</span>
                  </div>
                  <HeartRateGraph />
               </div>

               {/* Blood Oxygen Card */}
               <div className="bg-white/50 border border-white/60 backdrop-blur-xl p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="flex justify-between items-center mb-6 relative z-10">
                     <span className="font-bold text-neutral-700 text-sm">Blood Oxygen</span>
                     <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-500">
                        <span className="text-xs">💧</span>
                     </div>
                  </div>
                  <div className="flex items-baseline gap-1 mb-2 relative z-10">
                      <span className="text-4xl font-bold text-neutral-800">98</span>
                      <span className="text-sm font-medium text-neutral-500">%</span>
                  </div>
                  <OxygenGraph />
               </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}