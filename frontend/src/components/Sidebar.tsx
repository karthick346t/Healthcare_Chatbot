import React from "react";
import { 
  MdDashboard, 
  MdVideoCameraFront, 
  MdFavorite, 
  MdHistory, 
  MdLocalPharmacy, 
  MdPsychology, 
  MdSettings 
} from "react-icons/md";

const menuItems = [
  { icon: MdDashboard, label: "Dashboard", active: true },
  { icon: MdVideoCameraFront, label: "Telemedicine Video" },
  { icon: MdFavorite, label: "My Vitals" },
  { icon: MdHistory, label: "Lab History" },
  { icon: MdLocalPharmacy, label: "Pharmacy" },
  { icon: MdPsychology, label: "Mental Wellness" },
  { icon: MdSettings, label: "Settings" },
];

export default function Sidebar() {
  return (
    <div className="h-full flex flex-col py-6 pr-2 z-20 w-64 hidden lg:flex">
      {/* Brand Name with Gradient */}
      <div className="flex items-center gap-2 px-8 mb-10">
        <h1 className="text-3xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600 drop-shadow-sm">
          NEXA
        </h1>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-3 px-4">
        {menuItems.map((item) => (
          <button
            key={item.label}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
              item.active
                ? "bg-white/80 shadow-lg shadow-cyan-500/10 border border-white/60 backdrop-blur-md text-cyan-700"
                : "text-neutral-500 hover:bg-white/40 hover:text-cyan-600 hover:pl-5"
            }`}
          >
            <item.icon 
              className={`text-xl transition-colors ${
                item.active ? "text-cyan-500" : "text-neutral-400 group-hover:text-cyan-500"
              }`} 
            />
            <span className="text-sm font-bold tracking-wide">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer Links */}
      <div className="mt-auto px-8 py-4 text-[10px] text-neutral-400 font-bold flex gap-4 uppercase tracking-wider opacity-60">
        <span>Trust Badges</span>
        <span>Security</span>
      </div>
    </div>
  );
}