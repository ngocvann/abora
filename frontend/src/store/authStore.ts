import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: number;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  roles: string[];
  /** True nếu account đã thiết lập mật khẩu */
  hasPassword?: boolean;
  /** "GOOGLE" | null */
  oauthProvider?: string | null;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  updateUser: (partialUser: Partial<User>) => void;
  logout: () => void;
}

/**
 * Check if a user has admin role.
 * Handles both new format (roles: string[]) and legacy format (role: string)
 * stored in localStorage from before the roles array was introduced.
 */
export const isAdmin = (user: User | null | undefined): boolean => {
  if (!user) return false;
  // New format: roles array
  if (Array.isArray(user.roles) && user.roles.includes('ADMIN')) return true;
  // Legacy fallback: role string field stored in localStorage
  const legacyRole = (user as any).role as string | undefined;
  if (legacyRole === 'ADMIN') return true;
  return false;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
      updateUser: (partialUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partialUser } : null,
        })),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
  )
);
