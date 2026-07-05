"use client";

import { useWindowStore } from "@/store/useWindowStore";
import { APPS } from "@/config/apps.config";
import Magnetic from "@/components/ui/Magnetic";
import { dictionary } from "@/locales/dictionary";

export default function Dock() {
  const { openWindow, windows, focusWindow, toggleMinimize, isAIPaletteOpen, toggleAIPalette, systemLanguage } = useWindowStore();
  const t = dictionary[systemLanguage];
  const getAppName = (id: string) => (t as any)[`app_${id}`] || id;

  const handleDockClick = (id: string, name: string, icon: string) => {
    const win = windows.find((w) => w.id === id);
    if (!win) {
      openWindow(id, name, icon);
    } else {
      if (win.isMinimized) {
        toggleMinimize(id);
        focusWindow(id);
      } else {
        focusWindow(id);
      }
    }
  };

  const isRunning = (id: string) => windows.some((w) => w.id === id && w.isOpen);

  // Filter apps that should be in the dock
  const dockApps = APPS.filter(app => app.showInDock);

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
      <div className="glass-panel rounded-2xl flex items-center p-2 gap-2 shadow-2xl backdrop-blur-2xl bg-black/20">
        
        {/* Magic AI Button */}
        <div className="flex items-center gap-2">
          <Magnetic
            onClick={() => isAIPaletteOpen ? toggleAIPalette(false) : toggleAIPalette(true, 'expanded')}
            radius="12px"
            color="rgba(168, 85, 247, 0.3)" 
            className={`dock-item flex items-center justify-center w-12 h-12 rounded-xl border transition-all ${isAIPaletteOpen ? 'bg-purple-500/20 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 border-white/10 hover:border-purple-400/50'}`}
          >
            <span className={`material-symbols-rounded text-2xl ${isAIPaletteOpen ? 'text-purple-400' : 'text-slate-200'}`}>
              auto_awesome
            </span>
            {isAIPaletteOpen && <div className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc]"></div>}
          </Magnetic>
          <div className="w-[1px] h-8 bg-white/10 mx-1 rounded-full"></div>
        </div>

        {dockApps.map((app, index) => (
          <div key={app.id} className="flex items-center gap-2">
            <Magnetic 
              onClick={() => handleDockClick(app.id, getAppName(app.id), app.icon)} 
              radius="12px" 
              color={`${app.themeColor}33`} 
              className="dock-item flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/5 text-slate-300 group relative"
              title={getAppName(app.id)} // Added tooltip
            >
              <span className={`material-symbols-rounded text-2xl transition-colors`} style={{ color: "inherit" }} 
                    onMouseEnter={(e) => (e.currentTarget.style.color = app.themeColor)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "inherit")}>
                {app.icon}
              </span>
              {isRunning(app.id) && <div className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-white/50"></div>}
            </Magnetic>
            
            {/* Add separator logic if needed, but we removed the hardcoded one */}
          </div>
        ))}

      </div>
    </nav>
  );
}
