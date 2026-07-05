"use client";

import { useWindowStore } from "@/store/useWindowStore";
import { dictionary } from "@/locales/dictionary";

interface DesktopContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
}

export default function DesktopContextMenu({ isOpen, position, onClose }: DesktopContextMenuProps) {
  const { openWindow, systemLanguage } = useWindowStore();
  const t = dictionary[systemLanguage];

  if (!isOpen) return null;

  return (
    <div 
      className="fixed z-[9999] w-56 bg-[#1e1e1e]/90 backdrop-blur-2xl border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col py-1.5 font-sans"
      style={{ top: position.y, left: position.x }}
      onClick={(e) => e.stopPropagation()}
    >
      <button 
        onClick={() => {
          window.location.reload(); 
        }}
        className="w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-blue-600 hover:text-white flex items-center gap-3 transition-colors group"
      >
        <span className="material-symbols-rounded text-[18px] text-slate-400 group-hover:text-white transition-colors">refresh</span>
        {(t as any).menu_refresh || "Refresh"}
      </button>

      <div className="h-[1px] w-full bg-white/10 my-1.5"></div>

      <button 
        className="w-full px-4 py-2 text-left text-sm text-slate-400 flex items-center gap-3 cursor-not-allowed"
      >
        <span className="material-symbols-rounded text-[18px] opacity-50">create_new_folder</span>
        {(t as any).menu_new_folder || "New Folder"}
      </button>

      <div className="h-[1px] w-full bg-white/10 my-1.5"></div>

      <button 
        onClick={() => {
          openWindow("settings", (t as any).app_settings || "System Settings", "settings");
          onClose();
        }}
        className="w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-blue-600 hover:text-white flex items-center gap-3 transition-colors group"
      >
        <span className="material-symbols-rounded text-[18px] text-slate-400 group-hover:text-white transition-colors">tune</span>
        {(t as any).menu_personalize || "Personalize"}
      </button>
    </div>
  );
}
