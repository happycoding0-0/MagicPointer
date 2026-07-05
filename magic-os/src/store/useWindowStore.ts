import { create } from 'zustand';

export interface WindowState {
  id: string;
  title: string;
  icon: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  componentName?: string; // App rendering mapping
  payload?: any; // Data passed from AI or other apps
}

interface WindowStore {
  windows: WindowState[];
  activeWindowId: string | null;
  isAIPaletteOpen: boolean;
  aiPaletteMode: 'compact' | 'expanded';
  systemLanguage: 'en' | 'ko';
  osContext: any; // 전역 AI 컨텍스트 (사용자가 현재 보고 있는 앱의 구체적인 상태)
  toggleAIPalette: (isOpen?: boolean, mode?: 'compact' | 'expanded') => void;
  setLanguage: (lang: 'en' | 'ko') => void;
  setOSContext: (context: any) => void;
  openWindow: (id: string, title: string, icon: string, componentName?: string, payload?: any) => void;
  setWindowPayload: (id: string, payload: any) => void;
  closeWindow: (id: string) => void;
  toggleMinimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
  focusWindow: (id: string) => void;
  updatePosition: (id: string, x: number, y: number) => void;
  updateSize: (id: string, width: number, height: number) => void;
}

let nextZIndex = 100;

let initialLanguage: 'en' | 'ko' = 'ko';

export const useWindowStore = create<WindowStore>((set) => ({
  windows: [],
  activeWindowId: null,
  isAIPaletteOpen: false,
  aiPaletteMode: 'compact',
  systemLanguage: initialLanguage,
  osContext: null,

  setOSContext: (context) => set({ osContext: context }),

  setLanguage: (lang) => {
    if (typeof window !== "undefined") {
      localStorage.setItem('magicos_language', lang);
    }
    set({ systemLanguage: lang });
  },

  toggleAIPalette: (isOpen, mode) => {
    set((state) => ({
      isAIPaletteOpen: isOpen !== undefined ? isOpen : !state.isAIPaletteOpen,
      aiPaletteMode: mode || (isOpen === false ? 'compact' : state.aiPaletteMode)
    }));
  },

  setWindowPayload: (id, payload) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, payload } : w)),
    }));
  },

  openWindow: (id, title, icon, componentName, payload) => {
    set((state) => {
      const existing = state.windows.find((w) => w.id === id);
      if (existing) {
        nextZIndex += 1;
        return {
          windows: state.windows.map((w) =>
            w.id === id ? { ...w, isOpen: true, isMinimized: false, zIndex: nextZIndex, payload: payload !== undefined ? payload : w.payload } : w
          ),
          activeWindowId: id,
        };
      }
      
      // Load default dimensions from registry if available (dynamic import to avoid circular dependency in store)
      let defaultW = 800;
      let defaultH = 500;
      try {
        const { APPS } = require('@/config/apps.config');
        const appInfo = APPS.find((a: any) => a.id === id);
        if (appInfo) {
          defaultW = appInfo.defaultWidth || 800;
          defaultH = appInfo.defaultHeight || 500;
        }
      } catch(e) {}
      
      nextZIndex += 1;
      const newWindow: WindowState = {
        id,
        title,
        icon,
        isOpen: true,
        isMinimized: false,
        isMaximized: false,
        x: 100 + state.windows.length * 40,
        y: 100 + state.windows.length * 40,
        width: defaultW,
        height: defaultH,
        zIndex: nextZIndex,
        componentName,
        payload,
      };
      
      return {
        windows: [...state.windows, newWindow],
        activeWindowId: id,
      };
    });
  },

  closeWindow: (id) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, isOpen: false } : w)),
      activeWindowId: state.activeWindowId === id ? null : state.activeWindowId,
    }));
  },

  toggleMinimize: (id) => {
    set((state) => {
      const isCurrentlyMinimized = state.windows.find((w) => w.id === id)?.isMinimized;
      nextZIndex += 1;
      return {
        windows: state.windows.map((w) =>
          w.id === id ? { ...w, isMinimized: !w.isMinimized, zIndex: !isCurrentlyMinimized ? w.zIndex : nextZIndex } : w
        ),
        activeWindowId: !isCurrentlyMinimized ? null : id,
      };
    });
  },

  toggleMaximize: (id) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isMaximized: !w.isMaximized } : w
      ),
    }));
  },

  focusWindow: (id) => {
    set((state) => {
      if (state.activeWindowId === id) return state; 
      nextZIndex += 1;
      return {
        windows: state.windows.map((w) =>
          w.id === id ? { ...w, zIndex: nextZIndex, isMinimized: false } : w
        ),
        activeWindowId: id,
      };
    });
  },

  updatePosition: (id, x, y) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
    }));
  },

  updateSize: (id, width, height) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, width, height } : w)),
    }));
  },
}));
