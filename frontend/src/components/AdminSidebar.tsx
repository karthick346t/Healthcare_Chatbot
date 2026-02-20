import React from "react";
import { 
  MdDashboard, 
  MdPeople, 
  MdEvent, 
  MdLocalHospital, 
  MdSettings,
  MdPerson,
  MdLogout
} from "react-icons/md";
import { useAuth } from "../hooks/useAuth";
import { useLocation, useNavigate } from "react-router-dom";

import logo from "../assets/logo.png";
import NexaLogo from "../assets/NEXA.png";

const menuItems = [
  { icon: MdDashboard, label: "Overview", path: "/admin" },
  { icon: MdEvent, label: "Appointments", path: "/admin/appointments" },
  { icon: MdPeople, label: "Users", path: "/admin/users" },
  { icon: MdLocalHospital, label: "Doctors", path: "/admin/doctors" },
  { icon: MdPerson, label: "Profile", path: "/admin/profile" },
  { icon: MdSettings, label: "Settings", path: "/admin/settings" },
];

export default function AdminSidebar() {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col py-6 pr-4 z-20 w-64 hidden lg:flex shadow-none">
      {/* Brand Name */}
      <div className="flex items-center gap-3 px-6 mb-10 select-none">
        <div className="relative h-10 w-10 rounded-xl overflow-hidden border border-neutral-200 bg-white shadow-sm flex items-center justify-center">
             <img src={logo} alt="NEXA" className="h-full w-full object-contain p-1" />
        </div>
        <div className="flex flex-col">
            <span className="font-bold text-neutral-800 tracking-tight">NEXA ADMIN</span>
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Management</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-2 px-4 pt-4">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
          
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                isActive
                  ? "bg-[#f0f4f8] text-cyan-600 font-bold shadow-[inset_5px_5px_10px_rgba(163,177,198,0.6),inset_-5px_-5px_10px_rgba(255,255,255,0.8)]"
                  : "hover:bg-[#f0f4f8] text-neutral-500 hover:text-cyan-600 font-medium hover:shadow-[5px_5px_10px_rgba(163,177,198,0.4),-5px_-5px_10px_rgba(255,255,255,0.8)] hover:-translate-y-0.5"
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


    </div>
  );
}
