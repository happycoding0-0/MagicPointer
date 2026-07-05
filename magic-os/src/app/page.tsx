"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

import StatusBar from "@/components/StatusBar";
import Dock from "@/components/Dock";
import MagicCursor from "@/components/MagicCursor";
import WindowManager from "@/components/WindowManager";
import { useWindowStore } from "@/store/useWindowStore";
import { APPS } from "@/config/apps.config";
import Magnetic from "@/components/ui/Magnetic";
import AIPalette from "@/components/ui/AIPalette";
import OSContextMenu from "@/components/ui/OSContextMenu";
import { dictionary } from "@/locales/dictionary";
import { Toaster } from "react-hot-toast";

export default function Desktop() {
  const { openWindow, systemLanguage } = useWindowStore();
  const t = dictionary[systemLanguage];
  const getAppName = (id: string) => (t as any)[`app_${id}`] || id;

  const [contextMenu, setContextMenu] = useState({ isOpen: false, position: { x: 0, y: 0 } });
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasSeenWelcome = localStorage.getItem("magicos_has_seen_welcome");
    if (!hasSeenWelcome) {
      // First time visitor!
      openWindow("welcome", getAppName("welcome"), "explore");
      localStorage.setItem("magicos_has_seen_welcome", "true");
    }
  }, [openWindow, getAppName]);

  const desktopApps = APPS.filter(app => app.showOnDesktop);

  const handleDesktopContextMenu = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      setContextMenu({ ...contextMenu, isOpen: false });
      return;
    }

    e.preventDefault();
    
    const menuWidth = 220;
    const menuHeight = 150;
    let x = e.clientX;
    let y = e.clientY;
    
    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
    if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 10;

    setContextMenu({ isOpen: true, position: { x, y } });
  };

  const closeDesktopMenu = () => {
    if (contextMenu.isOpen) setContextMenu({ ...contextMenu, isOpen: false });
  };

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (desktopMenuRef.current && desktopMenuRef.current.contains(e.target as Node)) {
        return;
      }
      closeDesktopMenu();
    };
    if (contextMenu.isOpen) {
      window.addEventListener("mousedown", handleGlobalClick);
    }
    return () => {
      window.removeEventListener("mousedown", handleGlobalClick);
    };
  }, [contextMenu.isOpen]);

  if (!mounted) {
    return <main className="w-screen h-screen bg-black"></main>;
  }

  return (
    <main 
      className="w-screen h-screen overflow-hidden relative font-sans text-slate-800 selection:bg-blue-500/30"
      onContextMenu={handleDesktopContextMenu}
      onClick={closeDesktopMenu}
    >
      {/* Dynamic Background Image */}
      <div className="os-background"></div>

      <StatusBar />
      
      {/* Desktop App Icons */}
      <div className="absolute top-16 left-6 flex flex-col flex-wrap content-start h-[calc(100vh-150px)] gap-x-12 gap-y-10 z-0">
        {desktopApps.map((app) => (
          <motion.div
            key={app.id}
            drag
            dragMomentum={false}
            whileDrag={{ scale: 1.05, zIndex: 50 }}
            className="flex flex-col items-center cursor-grab active:cursor-grabbing w-24"
            onDoubleClick={(e) => {
              e.stopPropagation();
              openWindow(app.id, getAppName(app.id), app.icon);
            }}
          >
            <Magnetic 
              radius="16px" 
              color={`${app.themeColor}22`}
              className="flex flex-col items-center gap-2 group w-full"
            >
              <div className="w-16 h-16 rounded-2xl glass-panel flex items-center justify-center transition-all duration-300 group-hover:bg-white/10 group-hover:border-white/20 shadow-lg pointer-events-none">
                <span className="material-symbols-rounded text-4xl" style={{ color: app.themeColor }}>{app.icon}</span>
              </div>
              <span className="text-[13px] font-medium text-white/90 drop-shadow-md bg-black/20 px-2 py-0.5 rounded-md backdrop-blur-sm pointer-events-none text-center leading-tight">
                {getAppName(app.id)}
              </span>
            </Magnetic>
          </motion.div>
        ))}
      </div>

      <WindowManager />
      <Dock />
      {/* Custom Right-Click Menu */}
      <div ref={desktopMenuRef}>
        <OSContextMenu 
          isOpen={contextMenu.isOpen} 
          position={contextMenu.position} 
          onClose={() => setContextMenu({ ...contextMenu, isOpen: false })} 
          items={[
            { id: "refresh", label: (t as any).menu_refresh || "Refresh", icon: "refresh", onClick: () => window.location.reload() },
            { id: "div1", label: "", divider: true, onClick: () => {} },
            { id: "new_folder", label: (t as any).menu_new_folder || "New Folder", icon: "create_new_folder", disabled: true, onClick: () => {} },
            { id: "div2", label: "", divider: true, onClick: () => {} },
            { id: "personalize", label: (t as any).menu_personalize || "Personalize", icon: "tune", onClick: () => openWindow("settings", (t as any).app_settings || "System Settings", "settings") }
          ]}
        />
      </div>

      <MagicCursor />
      <AIPalette />
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
          }
        }}
      />
    </main>
  );
}
