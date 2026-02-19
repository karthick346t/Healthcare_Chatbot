import React from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { HiVideoCamera, HiDocumentText } from 'react-icons/hi';
import { 
  MdFavorite, 
  MdSettings
} from "react-icons/md";

import logo from "../assets/logo.png";
import NexaLogo from "../assets/NEXA.png";

const menuItems = [
  { icon: HiVideoCamera, label: 'Telemedicine', path: '/telemedicine' },
  { icon: HiDocumentText, label: 'Medical Records', path: '/records' },
  { icon: MdFavorite, label: "My Vitals", path: "/vitals" },
  { icon: MdSettings, label: "Settings", path: "/settings" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="h-full flex flex-col py-6 pr-4 z-20 w-64 hidden lg:flex shadow-none">
      {/* Brand Name */}
      <div className="flex items-center gap-4 px-6 mb-10 cursor-pointer select-none group" onClick={() => navigate('/')}>
        <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-[#eef2f5] shadow-[6px_6px_12px_#c8d0e7,-6px_-6px_12px_#ffffff] flex items-center justify-center text-cyan-600">
               <img
                src={logo}
                alt="NEXA icon"
                className="h-8 w-8 object-contain"
              />
            </div>
        </div>

          <div className="flex flex-col">
            <img
              src={NexaLogo}
              alt="NEXA"
              className="h-6 w-auto opacity-80"
            />
            <p className="text-[10px] text-neutral-400 font-bold tracking-wider">
              WELLNESS
            </p>
          </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-3 px-4 overflow-y-auto no-scrollbar py-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                isActive
                  ? "bg-[#eef2f5] text-cyan-600 font-bold shadow-[inset_5px_5px_10px_rgba(163,177,198,0.6),inset_-5px_-5px_10px_rgba(255,255,255,0.8)]"
                  : "hover:bg-[#eef2f5] text-neutral-500 hover:text-cyan-600 font-medium hover:shadow-[5px_5px_10px_rgba(163,177,198,0.4),-5px_-5px_10px_rgba(255,255,255,0.8)] hover:-translate-y-0.5"
              }`}
            >
              <item.icon 
                className={`text-xl transition-colors ${
                  isActive ? "text-cyan-600" : "text-neutral-400 group-hover:text-cyan-500"
                }`} 
              />
              <span className="text-sm tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Links */}
      <div className="mt-auto px-8 py-4 text-[10px] text-neutral-400 font-bold flex gap-4 uppercase tracking-wider opacity-60">
        <span>v2.0.0</span>
        <span>Secure</span>
      </div>
    </div>
  );
}