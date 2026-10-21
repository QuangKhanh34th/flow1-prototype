import React from "react";
import { Link } from "react-router-dom";
import { RetroWindow } from "../../components/RetroWindow";

export const OrdersManagementPage: React.FC = () => {
  return (
    <RetroWindow className="h-full min-h-[calc(100vh-2rem)]">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between border-b-2 border-dark pb-3 mb-6">
          <h1 className="text-2xl font-extrabold">Orders Management.sys (Flow 1)</h1>
          <Link
            to="/dashboard/staff/designs"
            className="px-3 py-1.5 bg-mint border-2 border-dark text-xs font-extrabold shadow-[2px_2px_0px_0px_#23261F]"
          >
            Go to Flow 3: Design Requests &rarr;
          </Link>
        </div>
        <div className="bg-white border-2 border-dark shadow-[4px_4px_0px_0px_#23261F] p-8 text-center text-dark/60 flex-1 flex flex-col items-center justify-center gap-3">
          <p className="font-bold text-sm">Hardware & Digital Store Orders Queue (Flow 1).</p>
          <p className="text-xs max-w-md">
            Select <strong>Design Requests (Staff)</strong> or <strong>Designer Studio</strong> in the left sidebar to test the full 8-step Custom Character Commission workflow (Flow 3).
          </p>
        </div>
      </div>
    </RetroWindow>
  );
};
