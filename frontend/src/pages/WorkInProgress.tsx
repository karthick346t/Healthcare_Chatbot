import React from "react";
import { useNavigate } from "react-router-dom";
import { MdArrowBack } from "react-icons/md";

const WorkInProgress = ({ title }: { title: string }) => {
  const navigate = useNavigate();

  return (
    <div className="flex w-full h-screen items-center justify-center bg-transparent relative overflow-hidden font-sans text-neutral-dark selection:bg-primary/20">

      {/* Glass Card */}
      <div className="relative z-10 bg-[#eef2f5] border-none rounded-3xl p-12 shadow-[8px_8px_16px_#c8d0e7,-8px_-8px_16px_#ffffff] flex flex-col items-center text-center max-w-lg mx-4">
        
        <div className="w-24 h-24 bg-[#eef2f5] rounded-3xl flex items-center justify-center shadow-[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff] mb-6">
           <span className="text-5xl animate-pulse">🚧</span>
        </div>

        <h1 className="text-3xl font-bold text-neutral-800 mb-2">{title}</h1>
        <p className="text-neutral-500 font-medium mb-8">
          We are currently building this feature to serve you better. Check back soon!
        </p>

        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#eef2f5] border-none shadow-[6px_6px_12px_#c8d0e7,-6px_-6px_12px_#ffffff] text-neutral-600 font-bold hover:shadow-[4px_4px_8px_#c8d0e7,-4px_-4px_8px_#ffffff] active:shadow-[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff] transition-all"
        >
          <MdArrowBack />
          <span>Go Back</span>
        </button>
      </div>
    </div>
  );
};

export default WorkInProgress;