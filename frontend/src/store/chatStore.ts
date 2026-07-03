import { create } from 'zustand';

export interface ChatPartner {
  id: number;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface ActiveChatWindow {
  user: ChatPartner;
  isMinimized: boolean;
}

interface ChatStoreState {
  activeChats: ActiveChatWindow[];
  totalUnreadCount: number;
  isMessengerDropdownOpen: boolean;
  openChat: (partner: ChatPartner) => void;
  minimizeChat: (partnerId: number) => void;
  expandChat: (partnerId: number) => void;
  closeChat: (partnerId: number) => void;
  toggleMessengerDropdown: () => void;
  setMessengerDropdownOpen: (open: boolean) => void;
  setTotalUnreadCount: (count: number) => void;
}

export const useChatStore = create<ChatStoreState>((set) => ({
  activeChats: [],
  totalUnreadCount: 0,
  isMessengerDropdownOpen: false,

  openChat: (partner) =>
    set((state) => {
      const existing = state.activeChats.find((c) => c.user.id === partner.id);
      if (existing) {
        // If already open, un-minimize it
        return {
          activeChats: state.activeChats.map((c) =>
            c.user.id === partner.id ? { ...c, isMinimized: false } : c
          ),
          isMessengerDropdownOpen: false
        };
      }
      // Max 3 active chat windows at a time (like FB)
      const newChats = [...state.activeChats];
      if (newChats.length >= 3) {
        newChats.shift(); // remove oldest
      }
      newChats.push({ user: partner, isMinimized: false });
      return { activeChats: newChats, isMessengerDropdownOpen: false };
    }),

  minimizeChat: (partnerId) =>
    set((state) => ({
      activeChats: state.activeChats.map((c) =>
        c.user.id === partnerId ? { ...c, isMinimized: true } : c
      ),
    })),

  expandChat: (partnerId) =>
    set((state) => ({
      activeChats: state.activeChats.map((c) =>
        c.user.id === partnerId ? { ...c, isMinimized: false } : c
      ),
    })),

  closeChat: (partnerId) =>
    set((state) => ({
      activeChats: state.activeChats.filter((c) => c.user.id !== partnerId),
    })),

  toggleMessengerDropdown: () =>
    set((state) => ({ isMessengerDropdownOpen: !state.isMessengerDropdownOpen })),

  setMessengerDropdownOpen: (open) => set({ isMessengerDropdownOpen: open }),

  setTotalUnreadCount: (count) => set({ totalUnreadCount: count }),
}));
