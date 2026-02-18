import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  MdDashboard, 
  MdVideoCameraFront, 
  MdFavorite, 
  MdHistory, 
  MdLocalPharmacy, 
  MdPsychology, 
  MdSettings 
} from "react-icons/md";

import logo from "../assets/logo.png";
import NexaLogo from "../assets/NEXA.png";

const menuItems = [
  { icon: MdDashboard, label: "Dashboard", path: "/" },
  { icon: MdVideoCameraFront, label: "Telemedicine Video", path: "/telemedicine" },
  { icon: MdFavorite, label: "My Vitals", path: "/vitals" },
  { icon: MdHistory, label: "Lab History", path: "/labs" },
  { icon: MdLocalPharmacy, label: "Pharmacy", path: "/medications" },
  { icon: MdPsychology, label: "Mental Wellness", path: "/wellness" },
  { icon: MdSettings, label: "Settings", path: "/settings" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="h-full flex flex-col py-6 pr-2 z-20 w-64 hidden lg:flex">
      {/* Brand Name with Gradient */}
      <div className="flex items-center gap-3 px-6 mb-10 cursor-pointer select-none group" onClick={() => navigate('/')}>
        <div className="relative">
            <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
            <div className="relative h-11 w-11 rounded-xl overflow-hidden border border-white/60 shadow-lg shadow-cyan-500/10 bg-white/80 flex items-center justify-center">
              <img
                src={logo}
                alt="NEXA icon"
                className="h-full w-full object-contain p-1.5"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <img
              src={NexaLogo}
              alt="NEXA"
              className="h-6 w-auto drop-shadow-sm pointer-events-none select-none opacity-90"
            />
            <p className="text-[10px] text-neutral-500 -mt-1 font-medium whitespace-nowrap">
              Your wellness companion
            </p>
          </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-3 px-4">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                isActive
                  ? "bg-white/80 shadow-lg shadow-cyan-500/10 border border-white/60 backdrop-blur-md text-cyan-700 font-bold"
                  : "text-neutral-500 hover:bg-white/40 hover:text-cyan-600 hover:pl-5 font-medium"
              }`}
            >
              <item.icon 
                className={`text-xl transition-colors ${
                  isActive ? "text-cyan-500" : "text-neutral-400 group-hover:text-cyan-500"
                }`} 
              />
              <span className="text-sm tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Links */}
      <div className="mt-auto px-8 py-4 text-[10px] text-neutral-400 font-bold flex gap-4 uppercase tracking-wider opacity-60">
        <span>Trust Badges</span>
        <span>Security</span>
      </div>
    </div>
  );
}