import React, { useState, useRef, useEffect } from "react";
import StaffSidebar from "./StaffSidebar";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { HiUserCircle, HiLogout } from "react-icons/hi";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex w-full h-screen overflow-hidden bg-[#eef2f5] text-neutral-dark font-sans relative">
      <StaffSidebar />

      <main className="flex-1 flex flex-col relative z-10 overflow-hidden w-full">
         {/* Staff Header */}
         <header className="px-8 py-5 flex justify-between items-center bg-transparent sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-neutral-700">Staff Dashboard</h2>
            </div>
            {/* Profile Section */}
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 bg-[#eef2f5] shadow-[6px_6px_12px_#c8d0e7,-6px_-6px_12px_#ffffff] px-4 py-2 rounded-2xl hover:shadow-[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff] transition-all focus:outline-none group"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-gray-800 leading-tight">
                    {user?.name || "Staff Member"}
                  </p>
                  <div className="flex flex-col items-end">
                      <span className="text-[10px] text-neutral-500 leading-none mt-0.5 uppercase tracking-wider font-semibold">{user?.role || "STAFF"}</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-[inset_2px_2px_4px_#c8d0e7,inset_-2px_-2px_4px_#ffffff] p-[2px]">
                  <div className="w-full h-full rounded-lg overflow-hidden bg-white">
                    <img
                      src={(user as any)?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'Staff'}&background=ccfbf1&color=0f766e&bold=true`}
                      alt="Staff Profile"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white/90 backdrop-blur-xl border border-white/60 rounded-2xl shadow-2xl z-[100] overflow-hidden ring-1 ring-black/5 animate-fadeIn">
                  <div className="p-5 border-b border-gray-100 bg-white/50">
                      <div className="flex items-center gap-4">
                          <img 
                              src={(user as any)?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'Staff'}&background=ccfbf1&color=0f766e&bold=true`}
                              alt={user?.name || 'Staff'} 
                              className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                              referrerPolicy="no-referrer"
                          />
                          <div className="flex flex-col overflow-hidden">
                              <span className="text-neutral-800 font-bold truncate text-base" title={user?.name}>{user?.name || 'Staff Member'}</span>
                              <span className="text-neutral-500 text-xs truncate" title={user?.email}>{user?.email || 'staff@healthbot.com'}</span>
                          </div>
                      </div>
                  </div>
                  
                  <div className="p-2">
                       <button
                          onClick={() => {
                              logout();
                              setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 flex items-center gap-3 transition-colors font-medium"
                      >
                          <HiLogout className="text-lg" />
                          <span>Logout</span>
                      </button>
                  </div>
                </div>
              )}
            </div>
         </header>

         <div className="p-8 flex-1 overflow-y-auto">
            {children}
         </div>
      </main>
    </div>
  );
}
