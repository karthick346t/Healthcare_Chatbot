import React from "react";
import { useNavigate } from "react-router-dom";
import { MdArrowBack } from "react-icons/md";

const WorkInProgress = ({ title }: { title: string }) => {
  const navigate = useNavigate();

  return (
    <div className="flex w-full h-screen items-center justify-center bg-transparent relative overflow-hidden font-sans text-neutral-dark selection:bg-primary/20">

      {/* Glass Card */}
      <div className="relative z-10 bg-neu dark:bg-neu-dark border-none rounded-3xl p-12 shadow-neu-out-lg dark:shadow-neu-out-lg-dark flex flex-col items-center text-center max-w-lg mx-4">
        
        <div className="w-24 h-24 bg-neu dark:bg-neu-dark rounded-3xl flex items-center justify-center shadow-neu-in dark:shadow-neu-in-dark mb-6">
           <span className="text-5xl animate-pulse">🚧</span>
        </div>

        <h1 className="text-3xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">{title}</h1>
        <p className="text-neutral-500 dark:text-neutral-400 font-medium mb-8">
          We are currently building this feature to serve you better. Check back soon!
        </p>

        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-neu dark:bg-neu-dark border-none shadow-neu-out dark:shadow-neu-out-dark text-neutral-600 dark:text-neutral-300 font-bold hover:shadow-neu-out dark:shadow-neu-out-dark active:shadow-neu-in dark:shadow-neu-in-dark transition-all"
        >
          <MdArrowBack />
          <span>Go Back</span>
        </button>
      </div>
    </div>
  );
};

export default WorkInProgress;