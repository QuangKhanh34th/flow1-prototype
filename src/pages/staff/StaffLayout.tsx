import React from "react";
import { Navigate, Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "../../stores/UserStore";
import { RetroWindow } from "../../components/RetroWindow";
import { useCommissionStore } from "../../stores/CommissionStore";

export const StaffLayout: React.FC = () => {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const role = useUserStore((state) => state.role);
  const userName = useUserStore((state) => state.userName);
  const switchRole = useUserStore((state) => state.switchRole);
  const logout = useUserStore((state) => state.logout);
  const commissions = useCommissionStore((state) => state.commissions);
  const location = useLocation();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <Navigate to="/dashboard/staff/login" state={{ from: location }} replace />;
  }

  const pendingStaffCount = commissions.filter((c) =>
    ["PENDING_REVIEW", "PAID_ESCROW", "INTERNAL_REVIEW", "CUSTOMER_REVISION_REQUESTED"].includes(
      c.status
    )
  ).length;

  const pendingDesignerCount = commissions.filter((c) =>
    ["IN_PROGRESS", "INTERNAL_REVISION_REQUIRED"].includes(c.status)
  ).length;

  return (
    <div className="min-h-screen bg-cream flex flex-col md:flex-row p-4 gap-6 font-mono text-dark">
      {/* Sidebar */}
      <RetroWindow className="w-full md:w-64 h-auto md:min-h-[calc(100vh-2rem)] flex-shrink-0">
        <div className="flex flex-col h-full min-h-[420px]">
          <div className="mb-6">
            <h2 className="text-lg font-extrabold border-b-2 border-dark pb-2 mb-2 uppercase">
              Internal Portal
            </h2>
            <div className="bg-mint/40 border border-dark p-2 text-[11px] space-y-1">
              <div>
                Role: <strong className="uppercase">{role}</strong>
              </div>
              <div className="truncate text-[10px] text-dark/80">{userName}</div>
            </div>
          </div>

          <nav className="flex-1 space-y-2.5 text-xs">
            <Link
              to="/dashboard/staff/orders"
              className={`block px-3 py-2 border-2 border-dark font-bold hover:bg-mint transition-colors ${
                location.pathname.includes("/orders")
                  ? "bg-mint shadow-[2px_2px_0px_0px_#23261F]"
                  : "bg-white"
              }`}
            >
              📦 Orders Management
            </Link>

            <Link
              to="/dashboard/staff/designs"
              onClick={() => switchRole("STAFF")}
              className={`flex items-center justify-between px-3 py-2 border-2 border-dark font-bold hover:bg-sage transition-colors ${
                location.pathname.includes("/designs")
                  ? "bg-sage shadow-[2px_2px_0px_0px_#23261F]"
                  : "bg-white"
              }`}
            >
              <span>🛠 Design Requests (Staff)</span>
              {pendingStaffCount > 0 && (
                <span className="bg-dark text-mint px-1.5 py-0.2 text-[10px] font-extrabold">
                  {pendingStaffCount}
                </span>
              )}
            </Link>

            <Link
              to="/dashboard/staff/designer"
              onClick={() => switchRole("DESIGNER")}
              className={`flex items-center justify-between px-3 py-2 border-2 border-dark font-bold hover:bg-mint transition-colors ${
                location.pathname.includes("/designer")
                  ? "bg-mint shadow-[2px_2px_0px_0px_#23261F]"
                  : "bg-white"
              }`}
            >
              <span>🎨 Designer Studio</span>
              {pendingDesignerCount > 0 && (
                <span className="bg-dark text-mint px-1.5 py-0.2 text-[10px] font-extrabold">
                  {pendingDesignerCount}
                </span>
              )}
            </Link>

            <div className="pt-4 border-t border-dark/20 space-y-2">
              <div className="text-[10px] font-bold text-dark/60 uppercase">
                Flow 3 Demo Switcher
              </div>
              <button
                type="button"
                onClick={() => {
                  switchRole("CUSTOMER");
                  navigate("/commissions");
                }}
                className="w-full text-left px-3 py-2 bg-cream hover:bg-mint border-2 border-dark font-bold text-[11px] cursor-pointer"
              >
                👤 View as Customer (/commissions) &rarr;
              </button>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="w-full text-left px-3 py-1.5 bg-white hover:bg-gray-100 border border-dark text-[11px] cursor-pointer"
              >
                🏪 Back to Storefront
              </button>
            </div>
          </nav>

          <div className="pt-4 border-t-2 border-dark mt-6">
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/dashboard/staff/login");
              }}
              className="w-full py-2 bg-dark text-cream font-bold text-xs hover:bg-gray-800 border-2 border-dark cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </RetroWindow>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};
