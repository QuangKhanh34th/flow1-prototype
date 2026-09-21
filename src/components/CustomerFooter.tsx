import React from "react";

export const CustomerFooter: React.FC = () => {
  return (
    <footer className="border-t-2 border-dark bg-mint mt-16">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 border-x-0 md:border-x-2 border-dark">
        <div className="p-6 border-b-2 md:border-b-0 md:border-r-2 border-dark flex flex-col justify-between space-y-4">
          <div>
            <h4 className="font-bold text-sm mb-3">Socials and contacts</h4>
            <div className="flex gap-2 flex-wrap">
              {["FB", "IG", "YT", "X", "DC", "GH"].map((label) => (
                <div
                  key={label}
                  className="w-8 h-8 rounded-full bg-gray-200 border border-dark flex items-center justify-center text-[10px] font-bold text-dark hover:bg-cream cursor-pointer transition-colors"
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-dark/70 font-mono">
            Copyright samples @ 2026 Team LED Windshield
          </p>
        </div>

        <div className="p-6 text-xs text-dark/80 font-mono leading-relaxed">
          Automotive HUD projection systems comply with exterior vehicle lighting statutes.
          All graphic packs and firmware assets distributed via the integrated gallery store.
        </div>
      </div>
    </footer>
  );
};
