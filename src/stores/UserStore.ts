import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "CUSTOMER" | "STAFF" | "DESIGNER";

interface UserStore {
  isAuthenticated: boolean;
  role: UserRole;
  userId: string;
  userName: string;
  login: (role?: UserRole) => void;
  switchRole: (role: UserRole) => void;
  logout: () => void;
}

const ROLE_PROFILES: Record<UserRole, { userId: string; userName: string }> = {
  CUSTOMER: { userId: "cus-01", userName: "Nguyen Quang Khanh (Customer)" },
  STAFF: { userId: "staff-01", userName: "Pham Tran Trung Hieu (Staff)" },
  DESIGNER: { userId: "des-01", userName: "Le Hoang Tuan (Designer)" },
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      isAuthenticated: true,
      role: "CUSTOMER",
      userId: ROLE_PROFILES.CUSTOMER.userId,
      userName: ROLE_PROFILES.CUSTOMER.userName,
      login: (role = "CUSTOMER") =>
        set({
          isAuthenticated: true,
          role,
          userId: ROLE_PROFILES[role].userId,
          userName: ROLE_PROFILES[role].userName,
        }),
      switchRole: (role) =>
        set({
          isAuthenticated: true,
          role,
          userId: ROLE_PROFILES[role].userId,
          userName: ROLE_PROFILES[role].userName,
        }),
      logout: () => set({ isAuthenticated: false }),
    }),
    {
      name: "led-windshield-user-store",
    }
  )
);
