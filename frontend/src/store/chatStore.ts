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

// Defensive Helpers for localStorage persistence
const getStoredObject = (key: string): Record<number, string> => {
  try {
    const val = localStorage.getItem(key);
    if (!val) return {};
    const parsed = JSON.parse(val);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const getStoredArray = (key: string): number[] => {
  try {
    const val = localStorage.getItem(key);
    if (!val) return [];
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
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
  nicknames: getStoredObject('abora_chat_nicknames'),
  mutedPartnerIds: getStoredArray('abora_chat_muted'),
  blockedUserIds: getStoredArray('abora_chat_blocked'),

  openChat: (partner) =>
    set((state) => {
      const activeChats = Array.isArray(state.activeChats) ? state.activeChats : [];
      const existing = activeChats.find((c) => c.user && c.user.id === partner.id);
      if (existing) {
        return {
          activeChats: activeChats.map((c) =>
            c.user && c.user.id === partner.id ? { ...c, isMinimized: false } : c
          ),
          isMessengerDropdownOpen: false,
          isDockVisible: true
        };
      }
      const newChats = [...activeChats];
      if (newChats.length >= 3) {
        newChats.shift();
      }
      newChats.push({ user: partner, isMinimized: false });
      return { activeChats: newChats, isMessengerDropdownOpen: false, isDockVisible: true };
    }),

  minimizeChat: (partnerId) =>
    set((state) => ({
      activeChats: (Array.isArray(state.activeChats) ? state.activeChats : []).map((c) =>
        c.user && c.user.id === partnerId ? { ...c, isMinimized: true } : c
      ),
    })),

  expandChat: (partnerId) =>
    set((state) => ({
      activeChats: (Array.isArray(state.activeChats) ? state.activeChats : []).map((c) =>
        c.user && c.user.id === partnerId ? { ...c, isMinimized: false } : c
      ),
    })),

  closeChat: (partnerId) =>
    set((state) => ({
      activeChats: (Array.isArray(state.activeChats) ? state.activeChats : []).filter((c) => c.user && c.user.id !== partnerId),
    })),

  toggleMessengerDropdown: () =>
    set((state) => ({ isMessengerDropdownOpen: !state.isMessengerDropdownOpen })),

  setMessengerDropdownOpen: (open) => set({ isMessengerDropdownOpen: open }),

  setIsDockVisible: (visible) => set({ isDockVisible: visible }),

  setTotalUnreadCount: (count) => set({ totalUnreadCount: count }),

  setNickname: (partnerId, nickname) =>
    set((state) => {
      const nicknames = (state.nicknames && typeof state.nicknames === 'object') ? state.nicknames : {};
      const updated = { ...nicknames, [partnerId]: nickname };
      try { localStorage.setItem('abora_chat_nicknames', JSON.stringify(updated)); } catch {}
      return { nicknames: updated };
    }),

  toggleMutePartner: (partnerId) =>
    set((state) => {
      const mutedPartnerIds = Array.isArray(state.mutedPartnerIds) ? state.mutedPartnerIds : [];
      const isMuted = mutedPartnerIds.includes(partnerId);
      const updated = isMuted
        ? mutedPartnerIds.filter((id) => id !== partnerId)
        : [...mutedPartnerIds, partnerId];
      try { localStorage.setItem('abora_chat_muted', JSON.stringify(updated)); } catch {}
      return { mutedPartnerIds: updated };
    }),

  toggleBlockUser: (partnerId) =>
    set((state) => {
      const blockedUserIds = Array.isArray(state.blockedUserIds) ? state.blockedUserIds : [];
      const isBlocked = blockedUserIds.includes(partnerId);
      const updated = isBlocked
        ? blockedUserIds.filter((id) => id !== partnerId)
        : [...blockedUserIds, partnerId];
      try { localStorage.setItem('abora_chat_blocked', JSON.stringify(updated)); } catch {}
      return { blockedUserIds: updated };
    }),
}));
