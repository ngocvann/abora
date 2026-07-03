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

// Helpers for localStorage persistence
const getStoredJSON = <T>(key: string, fallback: T): T => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
};

interface ChatStoreState {
  activeChats: ActiveChatWindow[];
  totalUnreadCount: number;
  isMessengerDropdownOpen: boolean;
  isDockVisible: boolean;
  nicknames: Record<number, string>;
  mutedPartnerIds: number[];
  blockedUserIds: number[];

  openChat: (partner: ChatPartner) => void;
  minimizeChat: (partnerId: number) => void;
  expandChat: (partnerId: number) => void;
  closeChat: (partnerId: number) => void;
  toggleMessengerDropdown: () => void;
  setMessengerDropdownOpen: (open: boolean) => void;
  setIsDockVisible: (visible: boolean) => void;
  setTotalUnreadCount: (count: number) => void;
  setNickname: (partnerId: number, nickname: string) => void;
  toggleMutePartner: (partnerId: number) => void;
  toggleBlockUser: (partnerId: number) => void;
}

export const useChatStore = create<ChatStoreState>((set) => ({
  activeChats: [],
  totalUnreadCount: 0,
  isMessengerDropdownOpen: false,
  isDockVisible: true,
  nicknames: getStoredJSON<Record<number, string>>('abora_chat_nicknames', {}),
  mutedPartnerIds: getStoredJSON<number[]>('abora_chat_muted', []),
  blockedUserIds: getStoredJSON<number[]>('abora_chat_blocked', []),

  openChat: (partner) =>
    set((state) => {
      const existing = state.activeChats.find((c) => c.user.id === partner.id);
      if (existing) {
        return {
          activeChats: state.activeChats.map((c) =>
            c.user.id === partner.id ? { ...c, isMinimized: false } : c
          ),
          isMessengerDropdownOpen: false,
          isDockVisible: true
        };
      }
      const newChats = [...state.activeChats];
      if (newChats.length >= 3) {
        newChats.shift();
      }
      newChats.push({ user: partner, isMinimized: false });
      return { activeChats: newChats, isMessengerDropdownOpen: false, isDockVisible: true };
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

  setIsDockVisible: (visible) => set({ isDockVisible: visible }),

  setTotalUnreadCount: (count) => set({ totalUnreadCount: count }),

  setNickname: (partnerId, nickname) =>
    set((state) => {
      const updated = { ...state.nicknames, [partnerId]: nickname };
      try { localStorage.setItem('abora_chat_nicknames', JSON.stringify(updated)); } catch {}
      return { nicknames: updated };
    }),

  toggleMutePartner: (partnerId) =>
    set((state) => {
      const isMuted = state.mutedPartnerIds.includes(partnerId);
      const updated = isMuted
        ? state.mutedPartnerIds.filter((id) => id !== partnerId)
        : [...state.mutedPartnerIds, partnerId];
      try { localStorage.setItem('abora_chat_muted', JSON.stringify(updated)); } catch {}
      return { mutedPartnerIds: updated };
    }),

  toggleBlockUser: (partnerId) =>
    set((state) => {
      const isBlocked = state.blockedUserIds.includes(partnerId);
      const updated = isBlocked
        ? state.blockedUserIds.filter((id) => id !== partnerId)
        : [...state.blockedUserIds, partnerId];
      try { localStorage.setItem('abora_chat_blocked', JSON.stringify(updated)); } catch {}
      return { blockedUserIds: updated };
    }),
}));
