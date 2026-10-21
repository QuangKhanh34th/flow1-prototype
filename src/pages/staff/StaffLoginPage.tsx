import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useUserStore, type UserRole } from "../../stores/UserStore";
import { RetroWindow } from "../../components/RetroWindow";
import { OffsetHeading } from "../../components/OffsetHeading";

export const StaffLoginPage: React.FC = () => {
  const login = useUserStore((state) => state.login);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const currentRole = useUserStore((state) => state.role);
  const [selectedRole, setSelectedRole] = useState<UserRole>("STAFF");
  const navigate = useNavigate();

  if (isAuthenticated && (currentRole === "STAFF" || currentRole === "DESIGNER")) {
    return (
      <Navigate
        to={
          currentRole === "DESIGNER"
            ? "/dashboard/staff/designer"
            : "/dashboard/staff/designs"
        }
        replace
      />
    );
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(selectedRole);
    navigate(
      selectedRole === "DESIGNER"
        ? "/dashboard/staff/designer"
        : "/dashboard/staff/designs"
    );
  };

  return (
    <div className="min-h-screen bg-mint flex items-center justify-center p-4 font-mono">
      <RetroWindow className="w-full max-w-md">
        <div className="space-y-6">
          <OffsetHeading
            text="Internal Portal Auth"
            className="text-center w-full block"
            boxColor="bg-sage"
          />

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-dark">Select Internal Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole("STAFF")}
                  className={`py-2 border-2 border-dark text-xs font-extrabold cursor-pointer ${
                    selectedRole === "STAFF"
                      ? "bg-mint shadow-[2px_2px_0px_0px_#23261F]"
                      : "bg-white"
                  }`}
                >
                  🛠 Staff Coordinator
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole("DESIGNER")}
                  className={`py-2 border-2 border-dark text-xs font-extrabold cursor-pointer ${
                    selectedRole === "DESIGNER"
                      ? "bg-mint shadow-[2px_2px_0px_0px_#23261F]"
                      : "bg-white"
                  }`}
                >
                  🎨 Pixel Designer
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-dark">Internal Email / ID</label>
              <div className="flex bg-white border-2 border-dark h-10 px-2 items-center shadow-[2px_2px_0px_0px_#23261F]">
                <input
                  type="text"
                  defaultValue={
                    selectedRole === "STAFF"
                      ? "hieuptt.staff@ledwindshield.vn"
                      : "tuanlh.designer@ledwindshield.vn"
                  }
                  className="bg-transparent outline-none text-xs w-full font-mono"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-dark">Password</label>
              <div className="flex bg-white border-2 border-dark h-10 px-2 items-center shadow-[2px_2px_0px_0px_#23261F]">
                <input
                  type="password"
                  defaultValue="••••••••"
                  className="bg-transparent outline-none text-xs w-full font-mono"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 mt-4 bg-sage hover:bg-mint border-2 border-dark font-extrabold text-xs shadow-[2px_2px_0px_0px_#23261F] transition-transform active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              Access {selectedRole === "STAFF" ? "Staff" : "Designer"} Terminal &rarr;
            </button>
          </form>
        </div>
      </RetroWindow>
    </div>
  );
};
