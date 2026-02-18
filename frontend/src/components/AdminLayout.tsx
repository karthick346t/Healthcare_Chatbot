import React from "react";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full h-screen overflow-hidden bg-[#f0f4f8] text-neutral-dark font-sans relative">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-100 blur-[150px] pointer-events-none" />
        
      <AdminSidebar />

      <main className="flex-1 flex flex-col relative z-10 overflow-y-auto w-full">
         {/* Admin Header (Simple) */}
         <header className="px-8 py-5 flex justify-between items-center bg-white/30 backdrop-blur-sm border-b border-white/40 sticky top-0 z-50">
            <h2 className="text-xl font-bold text-neutral-700">Admin Console</h2>
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-neutral-200 border border-white"></div>
            </div>
         </header>

         <div className="p-8">
            {children}
         </div>
      </main>
    </div>
  );
}
