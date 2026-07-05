"use client";

import { motion, useDragControls, useMotionValue } from "framer-motion";
import { useState, useEffect } from "react";
import { useWindowStore, WindowState } from "@/store/useWindowStore";
import { SYSTEM_CONFIG } from "@/config/system.config";
import Magnetic from "@/components/ui/Magnetic";
import AppRouter from "@/apps/AppRouter";
import { dictionary } from "@/locales/dictionary";

export default function Window({ windowState }: { windowState: WindowState }) {
  const { id, title, icon, isMinimized, isMaximized, width, height, zIndex } = windowState;
  const { focusWindow, closeWindow, toggleMinimize, toggleMaximize, activeWindowId, systemLanguage } = useWindowStore();
  
  const t = dictionary[systemLanguage];
  const dynamicTitle = (t as any)[`app_${id}`] || title;

  const dragControls = useDragControls();
  const isActive = activeWindowId === id;

  const x = useMotionValue(windowState.x);
  const y = useMotionValue(windowState.y);

  // 창이 완전히 사라지지 않도록 안전 마진(100px)을 남겨두는 드래그 제한 범위 계산
  const [constraints, setConstraints] = useState({ top: SYSTEM_CONFIG.UI.STATUS_BAR_HEIGHT, left: -1000, right: 2000, bottom: 2000 });
  useEffect(() => {
    if (typeof window !== "undefined") {
      setConstraints({
        top: SYSTEM_CONFIG.UI.STATUS_BAR_HEIGHT,
        left: -width + 100,
        right: window.innerWidth - 100,
        bottom: window.innerHeight - 100,
      });
    }
  }, [width, height]);

  if (!windowState.isOpen) return null;

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false} // Drag only from title bar
      dragMomentum={false}
      dragConstraints={constraints}
      style={{ 
        x, 
        y, 
        zIndex, 
        position: "absolute",
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: isMinimized ? 0 : 1, 
        scale: isMinimized ? 0.7 : 1,
        width: isMaximized ? "100vw" : width, 
        height: isMaximized ? `calc(100vh - ${SYSTEM_CONFIG.UI.STATUS_BAR_HEIGHT}px - 88px)` : height,
        top: isMaximized ? SYSTEM_CONFIG.UI.STATUS_BAR_HEIGHT - y.get() : 0, 
        left: isMaximized ? -x.get() : 0,
        borderRadius: isMaximized ? "0px" : "16px",
      }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      onPointerDown={() => focusWindow(id)}
      onContextMenu={(e) => {
        e.stopPropagation();
        // 텍스트를 드래그했거나, 입력창(Input/Textarea)인 경우에만 기본 우클릭 메뉴 허용 (복사/붙여넣기 방지 방지)
        const target = e.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
        const hasSelection = window.getSelection()?.toString().length || 0;
        
        if (!isInput && hasSelection === 0) {
          e.preventDefault();
        }
      }}
      className={`glass-panel overflow-hidden flex flex-col border ${isActive ? "border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.6)]" : "border-white/5 shadow-2xl"}`}
    >
      {/* Title Bar */}
      <div 
        onPointerDown={(e) => {
          focusWindow(id);
          if (!isMaximized) dragControls.start(e);
        }}
        onDoubleClick={() => toggleMaximize(id)}
        className="h-11 bg-white/5 border-b border-white/5 flex items-center justify-between px-4 cursor-pointer select-none backdrop-blur-md"
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-rounded text-[1.1rem] text-blue-400">{icon}</span>
          <span className="text-xs font-semibold text-slate-200 tracking-wide">{dynamicTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          <Magnetic as="button" onClick={(e: any) => { e.stopPropagation(); toggleMinimize(id); }} radius="50%" color="rgba(255,255,255,0.15)" className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-rounded text-[1rem]">remove</span>
          </Magnetic>
          <Magnetic as="button" onClick={(e: any) => { e.stopPropagation(); toggleMaximize(id); }} radius="50%" color="rgba(255,255,255,0.15)" className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-rounded text-[1rem]">{isMaximized ? 'close_fullscreen' : 'fullscreen'}</span>
          </Magnetic>
          <Magnetic as="button" onClick={(e: any) => { e.stopPropagation(); closeWindow(id); }} radius="50%" color="rgba(239,68,68,0.3)" className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-500/80 text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-rounded text-[1rem]">close</span>
          </Magnetic>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-black/10 overflow-hidden relative">
        <AppRouter appId={id} />
      </div>
    </motion.div>
  );
}
