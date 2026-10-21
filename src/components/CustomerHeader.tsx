import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthModal, type AuthView } from "./AuthModal";
import { useUserStore } from "../stores/UserStore";

interface CustomerHeaderProps {
  onNavigateToShop?: () => void;
  onOpenCart?: () => void;
  cartCount?: number;
}

export const CustomerHeader: React.FC<CustomerHeaderProps> = ({
  onNavigateToShop,
  onOpenCart,
  cartCount = 0,
}) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Auth Modal State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authView, setAuthView] = useState<AuthView>("login");
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const logout = useUserStore((state) => state.logout);

  const openAuth = (view: AuthView) => {
    setAuthView(view);
    setIsAuthOpen(true);
    setMenuOpen(false); // Close the dropdown when opening modal
  };

  return (
    <>
    <header className="border-b-2 border-dark bg-cream sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="bg-moss px-4 py-1.5 text-cream font-bold tracking-wide border-2 border-dark shadow-[2px_2px_0px_0px_#23261F] cursor-pointer"
          >
            Logo
          </button>
          <div className="flex items-center gap-4 text-sm font-medium">
            <button
              onClick={onNavigateToShop ?? (() => navigate("/"))}
              className="hover:underline flex items-center gap-1 cursor-pointer"
            >
              shop <span className="text-xs">▾</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/commissions")}
              className="px-2.5 py-0.5 bg-mint hover:bg-sage border-2 border-dark font-extrabold text-xs shadow-[2px_2px_0px_0px_#23261F] cursor-pointer"
            >
              ✨ custom design (Flow 3)
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard/staff/designs")}
              className="hidden sm:inline-block px-2 py-0.5 bg-white hover:bg-sage/40 border border-dark font-mono font-bold text-xs cursor-pointer"
            >
              🛠 staff / designer portal
            </button>
            <a href="#about" className="hover:underline">about</a>
          </div>
        </div>

        <div className="flex items-center gap-3 relative">
          <button className="p-1 hover:bg-sage/20 rounded" aria-label="Search">
            <span role="img" aria-label="search">🔍</span>
          </button>
          <span className="text-xs font-bold border border-dark px-2 py-0.5 rounded-sm">ENG ▾</span>

          <button
            onClick={onOpenCart}
            className="relative p-1 hover:bg-sage/20 border border-dark rounded-sm cursor-pointer"
            aria-label="Open cart"
          >
            🛍️
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-mint text-dark text-[10px] font-extrabold w-4 h-4 rounded-full border border-dark flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-8 h-8 border-2 border-dark bg-mint flex flex-col justify-center items-center gap-1 shadow-[2px_2px_0px_0px_#23261F] cursor-pointer"
              >
                <div className="w-4 h-0.5 bg-dark" />
                <div className="w-4 h-0.5 bg-dark" />
                <div className="w-4 h-0.5 bg-dark" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-cream border-2 border-dark shadow-neo text-xs z-50">
                  {isAuthenticated ? (
                    <>
                      <button
                        onClick={() => setMenuOpen(false)}
                        className="w-full text-left block px-3 py-2 hover:bg-sage/30 border-b border-dark/20 cursor-pointer"
                      >
                        Account
                      </button>
                      <button
                        onClick={() => {
                          logout();
                          setMenuOpen(false);
                        }}
                        className="w-full text-left block px-3 py-2 hover:bg-sage/30 border-b border-dark/20 cursor-pointer"
                      >
                        Log out
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => openAuth("login")}
                        className="w-full text-left block px-3 py-2 hover:bg-sage/30 border-b border-dark/20 cursor-pointer"
                      >
                        Login
                      </button>
                      <button
                        onClick={() => openAuth("signup")}
                        className="w-full text-left block px-3 py-2 hover:bg-sage/30 border-b border-dark/20 cursor-pointer"
                      >
                        Sign up
                      </button>
                    </>
                  )}
                  
                  <a href="#contact" className="block px-3 py-2 hover:bg-sage/30">Contact us!</a>
                </div>
              )}
            </div>
          </div>
      </div>

      <div className="bg-sage border-t-3 border-dark py-1 overflow-hidden whitespace-nowrap flex border-b-2">
        <div className="bg-sage py-1 overflow-hidden flex whitespace-nowrap">
          <div className="flex shrink-0 animate-marquee gap-8 pr-8 text-xs font-bold tracking-wider uppercase text-dark/80">
            {Array(30).fill("Banner").map((item, index) => (
              <span key={`first-${index}`}>{item}</span>
            ))}
          </div>
          <div className="flex shrink-0 animate-marquee gap-8 pr-8 text-xs font-bold tracking-wider uppercase text-dark/80" aria-hidden="true">
            {Array(30).fill("Banner").map((item, index) => (
              <span key={`second-${index}`}>{item}</span>
            ))}
          </div>
        </div>
      </div>
    </header>
    <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        initialView={authView} 
      />
      </>
  );
};
