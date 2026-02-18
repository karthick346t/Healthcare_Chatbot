import React, { useState, useContext, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import logo from "../assets/logo.png";
import NexaLogo from "../assets/NEXA.png"; // your NEXA wordmark

import { HiOutlineInformationCircle, HiMenu, HiUserCircle, HiLogout } from "react-icons/hi";
import { TbLanguage } from "react-icons/tb";

import languages from "../locales/languages.json";
import { LanguageContext } from "../context/LanguageContext";
import { useAuth } from "../hooks/useAuth";
import i18n from "../utils/i18n";

export default function Header() {
  const { t } = useTranslation();
  const { selectedLanguage, setLanguage } = useContext(LanguageContext);
  const { user, logout } = useAuth();

  const [showMenu, setShowMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleHelp = () => {
    alert(
      t(
        "About this chatbot:\nYour privacy is protected. For emergencies, please contact local medical services."
      )
    );
  };

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest(".lang-menu-header")) {
        setShowLangMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const currentLang =
    (Array.isArray(languages) &&
      languages.find((l) => l.code === selectedLanguage)) ||
    languages[0];

  function handleLanguageChange(code: string) {
    setLanguage(code);
    i18n.changeLanguage(code);
    setShowLangMenu(false);
  }

  // Simple "go home" without react-router
  function goHome() {
    window.location.href = "/"; // or "/index.html" if needed
  }

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <header className="w-full relative z-50 mb-6">
      <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">
        {/* LEFT — Empty for now (or could be Breadcrumbs later) */}
        <div className="flex items-center gap-3">
          {/* Logo removed as requested */}
        </div>

        {/* RIGHT — Info + Language + User + Menu */}
        <div className="flex items-center gap-4">
          {/* Info button */}
          <button
            onClick={handleHelp}
            className="p-2 rounded-xl bg-white/60 border border-white/80 hover:border-cyan-400/50 hover:bg-white/90 transition-all duration-200 shadow-sm hover:shadow-cyan-500/20"
            aria-label={t("Help & Privacy")}
          >
            <HiOutlineInformationCircle className="text-neutral-500 hover:text-cyan-600 text-xl transition-colors" />
          </button>

          {/* Language dropdown */}
          <div className="relative lang-menu-header hidden sm:block">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowLangMenu((prev) => !prev);
              }}
              className="flex items-center gap-2 px-3 h-10 rounded-xl bg-white/60 border border-white/80 hover:border-cyan-400/50 hover:bg-white/90 transition-all duration-200 shadow-sm hover:shadow-cyan-500/20 text-neutral-600 text-sm font-semibold"
              aria-label={t("Change language")}
            >
              <TbLanguage className="text-lg text-neutral-500" />
              <span className="hidden sm:inline">
                {currentLang?.emoji} {currentLang?.native}
              </span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-xl border border-white/60 rounded-xl shadow-xl z-50 overflow-hidden animate-fadeIn">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full text-left px-4 py-3 text-xs font-medium flex items-center gap-3 transition-colors ${selectedLanguage === lang.code ? "bg-cyan-50 text-cyan-700" : "text-neutral-600 hover:bg-white/50"}`}
                  >
                    <span className="text-lg">{lang.emoji}</span>
                    <span>{lang.native}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          {user && (
            <div className="relative z-50" ref={userMenuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("Avatar clicked!", showUserMenu); 
                  setShowUserMenu((prev) => !prev);
                }}
                className="flex items-center gap-2 p-1 pl-2 rounded-full hover:bg-white/50 transition-all duration-200 border border-transparent hover:border-white/60"
                aria-label="User Menu"
                type="button"
              >
                <div className="hidden md:flex flex-col items-end mr-1">
                    <span className="text-xs font-bold text-neutral-700 leading-none">{user.name}</span>
                    <span className="text-[10px] text-neutral-500 leading-none mt-0.5">Patient</span>
                </div>
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center border-2 border-white shadow-md text-white">
                     <span className="text-sm font-bold">{user.name?.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </button>

              {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white/90 backdrop-blur-xl border border-white/60 rounded-2xl shadow-2xl z-[100] overflow-hidden ring-1 ring-black/5 animate-fadeIn">
                    <div className="p-5 border-b border-gray-100 bg-white/50">
                        <div className="flex items-center gap-4">
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" />
                            ) : (
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold border-2 border-white shadow-sm">
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-neutral-800 font-bold truncate text-base" title={user.name}>{user.name}</span>
                                <span className="text-neutral-500 text-xs truncate" title={user.email}>{user.email}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-2">
                        {/* Future menu items can go here */}
                         {user.role === 'admin' && (
                             <a
                                href="/admin"
                                className="w-full text-left px-4 py-3 text-sm rounded-xl text-neutral-600 hover:bg-neutral-50 hover:text-cyan-600 flex items-center gap-3 transition-colors font-medium"
                             >
                                <HiUserCircle className="text-lg" />
                                <span>{t("Admin Dashboard")}</span>
                             </a>
                         )}
                         <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-3 text-sm rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 flex items-center gap-3 transition-colors font-medium"
                        >
                            <HiLogout className="text-lg" />
                            <span>{t("Logout")}</span>
                        </button>
                    </div>
                  </div>
              )}
            </div>
          )}

          {/* Login Button (if not logged in) - Optional, but good practice */}
          {!user && (
              <a href="/login" className="hidden sm:block text-sm font-semibold text-neutral-600 hover:text-cyan-600 transition-colors bg-white/60 px-4 py-2 rounded-xl border border-white/80 hover:shadow-sm">
                  {t("Login")}
              </a>
          )}


          {/* Mobile menu button */}
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className="sm:hidden p-2 rounded-xl bg-white/60 border border-white/80 hover:border-cyan-400/50 hover:bg-white/90 transition-all duration-200"
            aria-label={t("Menu")}
          >
            <HiMenu className="text-neutral-600 hover:text-cyan-600 text-xl" />
          </button>
        </div>
      </div>

      {showMenu && (
        <div className="sm:hidden bg-white/90 border-t border-gray-100 px-5 py-3 backdrop-blur-xl">
            <div className="flex flex-col gap-3">
             {/* Mobile Language Selector */}
             <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-neutral-500 text-sm font-medium">{t("Language")}</span>
                 <button
                    onClick={() => setShowLangMenu(!showLangMenu)}
                    className="flex items-center gap-2 text-neutral-700 text-sm font-semibold"
                  >
                    <TbLanguage className="text-lg" />
                    <span>{currentLang?.native}</span>
                  </button>
             </div>
             {showLangMenu && (
                 <div className="grid grid-cols-2 gap-2 mb-2">
                     {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleLanguageChange(lang.code)}
                            className={`text-left px-3 py-2 text-sm rounded-lg ${selectedLanguage === lang.code ? 'bg-cyan-50 text-cyan-700 border border-cyan-100' : 'text-neutral-600 bg-gray-50'}`}
                        >
                            {lang.emoji} {lang.native}
                        </button>
                     ))}
                 </div>
             )}

             {/* Mobile Logout if logged in */}
             {user && (
                 <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 py-2 font-medium">
                     <HiLogout />
                     {t("Logout")}
                 </button>
             )}
            </div>
        </div>
      )}
    </header>
  );
}
