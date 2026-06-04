import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light' | 'sepia';

interface ReaderState {
  fontSize: number;
  theme: Theme;
  setFontSize: (size: number) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  setTheme: (theme: Theme) => void;
}

export const useReaderStore = create<ReaderState>()(
  persist(
    (set) => ({
      fontSize: 18,
      theme: 'dark',
      setFontSize: (size) => set({ fontSize: size }),
      increaseFontSize: () => set((state) => ({ fontSize: Math.min(state.fontSize + 2, 32) })),
      decreaseFontSize: () => set((state) => ({ fontSize: Math.max(state.fontSize - 2, 12) })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'reader-storage',
    }
  )
);
