import React, { useState, useEffect } from "react";
import { useUserStore } from "../stores/UserStore";

export type AuthView = "login" | "signup" | "authcode";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: AuthView;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialView = "login",
}) => {
  const [view, setView] = useState<AuthView>(initialView);
  const login = useUserStore((state) => state.login);

  // Reset view when modal opens
  useEffect(() => {
    if (isOpen) setView(initialView);
  }, [isOpen, initialView]);

  if (!isOpen) return null;

  // Reusable Window Title Bar based on the design
  const TitleBar = ({ title }: { title: string }) => (
    <div className="border-b-2 border-dark flex items-center justify-between bg-white h-8">
      <div className="flex items-center gap-2 px-2">
        <div className="w-3.5 h-3.5 rounded-full border border-dark bg-mint" />
        <span className="text-xs font-bold text-dark">{title}</span>
      </div>
      <div className="flex h-full">
        <button className="w-10 border-l-2 border-dark bg-mint hover:bg-sage flex items-center justify-center text-[10px] font-bold">
          □
        </button>
        <button 
          onClick={onClose}
          className="w-10 border-l-2 border-dark bg-sage hover:bg-mint flex items-center justify-center text-[10px] font-bold"
        >
          ✕
        </button>
      </div>
    </div>
  );

  // Reusable Social Footer
  const SocialFooter = ({ label }: { label: string }) => (
    <div className="bg-sage border-t-2 border-dark p-4 flex items-center justify-between">
      <div className="relative inline-block z-10">
        <div className="absolute top-1 left-1 w-full h-full bg-dark/40 -z-10" />
        <span className="text-sm font-bold">{label}</span>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-6 h-6 rounded-full bg-cream border border-dark/20" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-dark/60 backdrop-blur-sm p-4">
      {/* Modal Container */}
      <div className={`flex flex-col md:flex-row border-2 border-dark shadow-neo bg-cream w-full overflow-hidden transition-all duration-300 ${view === 'authcode' ? 'max-w-md' : 'max-w-3xl'}`}>
        
        {/* Left Side (Hidden on Auth Code view) */}
        {view !== "authcode" && (
          <div className="hidden md:flex flex-col w-2/5 bg-dark text-cream p-8 relative overflow-hidden">
            <h2 className="text-4xl font-extrabold relative z-10 tracking-tight leading-tight">
              {view === "login" ? "Welcome\nback." : "Join our\ncommunity\nTODAY"}
            </h2>
            {/* Mocking the pixel art Gameboy image placement */}
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-gray-600 border-4 border-dark rounded-xl opacity-80 flex items-center justify-center rotate-12">
              <span className="text-xs text-cream/50 font-mono">[Pixel Art Image]</span>
            </div>
          </div>
        )}

        {/* Right Side (Forms) */}
        <div className={`flex flex-col flex-1 bg-cream ${view === 'authcode' ? 'w-full' : 'w-3/5'}`}>
          <TitleBar title={
            view === "login" ? "Login" : 
            view === "signup" ? "Sign up for an account" : 
            "Authentication"
          } />

          <div className="p-6 md:p-8 flex-1 flex flex-col justify-center">
            
            {/* --- LOGIN VIEW --- */}
            {view === "login" && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold">Email/Phone</label>
                  <div className="flex bg-gray-200 h-8 px-2 items-center gap-2">
                    <div className="w-3 h-3 bg-mint rounded-sm" /> {/* Placeholder for User Icon */}
                    <input type="text" className="bg-transparent outline-none text-sm w-full" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold">Password</label>
                  <div className="flex bg-gray-200 h-8 px-2 items-center gap-2">
                    <div className="w-3 h-3 bg-sage rounded-full" /> {/* Placeholder for Key Icon */}
                    <input type="password" className="bg-transparent outline-none text-sm w-full" />
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" className="accent-mint" /> Remember me
                  </label>
                  <button className="hover:underline cursor-pointer">Forgot Password?</button>
                </div>
                <div className="pt-4 flex flex-col items-center gap-2">
                  <button
                    onClick={() => {
                      login();
                      onClose();
                    }}
                    className="w-32 py-1.5 bg-mint hover:bg-sage border-2 border-dark font-bold text-sm shadow-[2px_2px_0px_0px_#23261F] transition-transform active:translate-x-0.5 active:translate-y-0.5"
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => setView('signup')}
                    className="text-[10px] hover:underline cursor-pointer mt-1"
                  >
                    No account? Sign up now!
                  </button>
                </div>
              </div>
            )}

            {/* --- SIGNUP VIEW --- */}
            {view === "signup" && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold">Email/Phone</label>
                  <div className="flex bg-gray-200 h-8 px-2 items-center gap-2">
                    <div className="w-3 h-3 bg-mint rounded-sm" />
                    <input type="text" className="bg-transparent outline-none text-sm w-full" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold">Password</label>
                  <div className="flex bg-gray-200 h-8 px-2 items-center gap-2">
                    <div className="w-3 h-3 bg-sage rounded-full" />
                    <input type="password" className="bg-transparent outline-none text-sm w-full" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold">Confirm password</label>
                  <div className="flex bg-gray-200 h-8 px-2 items-center gap-2">
                    <div className="w-3 h-3 bg-sage rounded-full" />
                    <input type="password" className="bg-transparent outline-none text-sm w-full" />
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-[10px] font-bold">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" className="accent-mint" /> Remember me
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" className="accent-mint" /> I have read and accept Term of Service
                  </label>
                </div>
                <div className="pt-2 flex justify-center">
                  <button 
                    onClick={() => setView('authcode')}
                    className="w-32 py-1.5 bg-sage hover:bg-mint border-2 border-dark font-bold text-sm shadow-[2px_2px_0px_0px_#23261F] transition-transform active:translate-x-0.5 active:translate-y-0.5"
                  >
                    Sign-up
                  </button>
                </div>
              </div>
            )}

            {/* --- AUTH CODE VIEW --- */}
            {view === "authcode" && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold">Authcode</label>
                  <div className="flex bg-gray-200 h-8 px-2 items-center gap-2">
                    <div className="w-3 h-3 bg-mint rounded-sm" />
                    <input type="text" className="bg-transparent outline-none text-sm w-full" />
                  </div>
                </div>
                <div className="flex justify-end text-[10px] font-bold">
                  <button className="hover:underline cursor-pointer">Resend code</button>
                </div>
                <div className="pt-4 flex justify-center">
                  <button 
                    onClick={() => {
                      login();
                      onClose();
                    }}
                    className="w-32 py-1.5 bg-sage hover:bg-mint border-2 border-dark font-bold text-sm shadow-[2px_2px_0px_0px_#23261F] transition-transform active:translate-x-0.5 active:translate-y-0.5"
                  >
                    Sign up
                  </button>
                </div>
              </div>
            )}

          </div>

          <SocialFooter label={view === "login" ? "Login with" : "Sign up with"} />
        </div>
      </div>
    </div>
  );
};