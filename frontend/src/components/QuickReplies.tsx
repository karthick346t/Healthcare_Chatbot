import React from "react";

export default function QuickReplies({
  options = [],
  onSelect
}: {
  options?: string[];
  onSelect?: (option: string) => void
}) {
  return (
    <div className="flex gap-1.5 flex-nowrap items-center h-full">
      {options.map((option, idx) => {
        let btnClass = "bg-primary/5 text-primary border-primary/10";
        const lower = option.toLowerCase();

        if (lower === "yes" || lower === "ok") btnClass = "bg-[#4db6ac] text-white border-transparent";
        if (lower === "no" || lower === "cancel") btnClass = "bg-[#e57373] text-white border-transparent";
        if (lower === "not sure") btnClass = "bg-[#eceff1] text-neutral-600 border-transparent";

        return (
          <button
            key={idx}
            onClick={() => onSelect?.(option)}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 whitespace-nowrap border ${btnClass}`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
