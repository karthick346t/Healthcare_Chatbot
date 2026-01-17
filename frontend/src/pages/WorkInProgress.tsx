import React from "react";
import { useNavigate } from "react-router-dom";
import { MdArrowBack } from "react-icons/md";

const WorkInProgress = ({ title }: { title: string }) => {
  const navigate = useNavigate();

  return (
    <div className="flex w-full h-screen items-center justify-center bg-[#eef2f6] relative overflow-hidden font-sans text-neutral-dark selection:bg-primary/20">
      
      {/* Background Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-cyan-400/20 to-teal-300/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tl from-blue-500/20 to-indigo-400/20 blur-[100px] pointer-events-none" />

      {/* Glass Card */}
      <div className="relative z-10 bg-white/40 border border-white/60 backdrop-blur-xl rounded-[2.5rem] p-12 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center max-w-lg mx-4">
        
        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-white rounded-3xl flex items-center justify-center shadow-inner mb-6 border border-white/80">
           <span className="text-5xl animate-pulse">🚧</span>
        </div>

        <h1 className="text-3xl font-bold text-neutral-800 mb-2">{title}</h1>
        <p className="text-neutral-500 font-medium mb-8">
          We are currently building this feature to serve you better. Check back soon!
        </p>

        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-white/80 text-neutral-600 font-bold hover:bg-white/80 hover:scale-105 transition-all shadow-sm"
        >
          <MdArrowBack />
          <span>Go Back</span>
        </button>
      </div>
    </div>
  );
};

export default WorkInProgress;