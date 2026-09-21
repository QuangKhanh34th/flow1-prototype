import React from "react";

interface RetroWindowProps {
  children: React.ReactNode;
  specs?: string[];
  className?: string;
}

export const RetroWindow: React.FC<RetroWindowProps> = ({ children, specs, className = "" }) => {
  return (
    <div className={`relative ${className}`}>
      {/* Offset green backing */}
      <div className="absolute inset-0 translate-x-4 translate-y-4 bg-sage rounded-sm border-2 border-dark" />
      
      {/* Main Window */}
      <div className="relative bg-cream border-2 border-dark rounded-sm overflow-hidden z-10">
        {/* Title bar */}
        <div className="bg-moss border-b-2 border-dark px-3 py-1.5 flex items-center justify-between">
          <div className="w-3.5 h-3.5 rounded-full border border-dark bg-mint" />
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 border border-dark bg-cream flex items-center justify-center text-[8px] font-bold">□</div>
            <div className="w-4 h-3 border border-dark bg-cream flex items-center justify-center text-[8px] font-bold leading-none">✕</div>
          </div>
        </div>

        {/* Window Content */}
        <div className="p-4 bg-cream">
          {children}

          {specs && specs.length > 0 && (
            <div className="mt-4 pt-3 border-t border-dark/20 text-xs text-dark space-y-1 font-mono">
              {specs.map((spec, i) => (
                <div key={i}>- {spec}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};