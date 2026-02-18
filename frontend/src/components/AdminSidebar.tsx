import React from "react";
import { 
  MdDashboard, 
  MdPeople, 
  MdEvent, 
  MdLocalHospital, 
  MdSettings,
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
  { icon: MdSettings, label: "Settings", path: "/admin/settings" },
];

export default function AdminSidebar() {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col py-6 pr-2 z-20 w-64 hidden lg:flex bg-white/50 backdrop-blur-md border-r border-white/40">
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
      <nav className="flex-1 space-y-2 px-4">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
          
          return (
            <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                    ? "bg-neutral-800 text-white shadow-lg shadow-neutral-800/20" 
                    : "text-neutral-500 hover:bg-white/60 hover:text-neutral-800"
                }`}
            >
                <item.icon className={`text-xl ${isActive ? 'text-cyan-400' : ''}`} />
                <span className="text-sm font-semibold">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 mt-auto">
        <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors font-semibold text-sm"
        >
            <MdLogout className="text-xl" />
            <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
