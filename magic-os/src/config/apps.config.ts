export interface AppConfig {
  id: string;
  name: string;
  icon: string;
  themeColor: string; // Used for dock hover, magic cursor, etc.
  showInDock: boolean;
  showOnDesktop: boolean;
  defaultWidth?: number;
  defaultHeight?: number;
}

export const APPS: AppConfig[] = [
  {
    id: "explorer",
    name: "File Explorer",
    icon: "folder",
    themeColor: "#4285f4", // Blue
    showInDock: true,
    showOnDesktop: true,
    defaultWidth: 800,
    defaultHeight: 500,
  },
  {
    id: "browser",
    name: "Web Browser",
    icon: "public",
    themeColor: "#0ea5e9", // Sky Blue
    showInDock: true,
    showOnDesktop: true,
    defaultWidth: 1000,
    defaultHeight: 700,
  },
  {
    id: "notes",
    name: "Notes",
    icon: "edit_document",
    themeColor: "#f59e0b", // Amber/Yellow
    showInDock: true,
    showOnDesktop: true,
    defaultWidth: 600,
    defaultHeight: 700,
  },
  {
    id: "settings",
    name: "System Settings",
    icon: "settings",
    themeColor: "#9ca3af", // Gray
    showInDock: true,
    showOnDesktop: true,
    defaultWidth: 700,
    defaultHeight: 500,
  },
  {
    id: "messenger",
    name: "Magic Assistant",
    icon: "smart_toy",
    themeColor: "#3b82f6", // Bright Blue
    showInDock: false, // 팝업으로 합쳐졌으므로 독에서 숨김
    showOnDesktop: false,
    defaultWidth: 850,
    defaultHeight: 650,
  },
  {
    id: "welcome",
    name: "Start Guide",
    icon: "explore",
    themeColor: "#a855f7", // Purple
    showInDock: false,
    showOnDesktop: true,
    defaultWidth: 700,
    defaultHeight: 600,
  },
  {
    id: "media",
    name: "Media Player",
    icon: "play_circle",
    themeColor: "#ef4444", // Red
    showInDock: true,
    showOnDesktop: true,
    defaultWidth: 900,
    defaultHeight: 600,
  },
  {
    id: "news",
    name: "Daily News",
    icon: "newspaper",
    themeColor: "#3b82f6", // Blue
    showInDock: true,
    showOnDesktop: true,
    defaultWidth: 800,
    defaultHeight: 700,
  },
  {
    id: "stock",
    name: "Stocks",
    icon: "show_chart",
    themeColor: "#10b981", // Emerald Green
    showInDock: true,
    showOnDesktop: true,
    defaultWidth: 800,
    defaultHeight: 600,
  },
  {
    id: "map",
    name: "Maps",
    icon: "map",
    themeColor: "#22c55e", // Green
    showInDock: true,
    showOnDesktop: true,
    defaultWidth: 900,
    defaultHeight: 650,
  },
];
