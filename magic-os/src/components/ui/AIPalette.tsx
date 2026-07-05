"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useDragControls, useMotionValue, animate } from "framer-motion";
import Magnetic from "@/components/ui/Magnetic";
import { useWindowStore } from "@/store/useWindowStore";
import { vfs } from "@/lib/vfs";
import { dictionary } from "@/locales/dictionary";
import MessengerApp from "@/apps/Messenger/MessengerApp";

export default function AIPalette() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const { windows, openWindow, isAIPaletteOpen, aiPaletteMode, toggleAIPalette, systemLanguage } = useWindowStore();
  const t = dictionary[systemLanguage];
  const inputRef = useRef<HTMLInputElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });

  const isExpanded = aiPaletteMode === 'expanded';

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const dragControls = useDragControls();

  // 전역 마우스 위치 추적 (가벼운 참조형)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Global hotkey: Ctrl + Space to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        toggleAIPalette();
      }
      if (e.code === 'Escape' && isAIPaletteOpen) {
        toggleAIPalette(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAIPaletteOpen, toggleAIPalette]);

  useEffect(() => {
    if (isAIPaletteOpen && inputRef.current) {
      // 열릴 때 현재 마우스 좌표를 캡처하여 위치 지정 (화면 밖으로 나가지 않게 보정)
      const ww = window.innerWidth;
      const wh = window.innerHeight;
      const paletteWidth = 320; // 예상 너비
      let paletteHeight = isExpanded ? 650 : 200;

      let finalX = mousePosRef.current.x + 15;
      let finalY = mousePosRef.current.y + 15;

      if (isExpanded) {
        finalX = ww / 2 - paletteWidth / 2;
        finalY = wh / 2 - paletteHeight / 2;
      } else {
        if (finalX + paletteWidth > ww) finalX = ww - paletteWidth - 20;
        if (finalY + paletteHeight > wh) finalY = wh - paletteHeight - 20;
      }

      animate(x, finalX, { type: "spring", stiffness: 300, damping: 30 });
      animate(y, finalY, { type: "spring", stiffness: 300, damping: 30 });

      if (!isExpanded) {
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      setResponse(null);
      setQuery("");
    }
  }, [isAIPaletteOpen, isExpanded, x, y]);

  // 외부 클릭 시 패널 닫기 (이벤트 버블링 캡처)
  useEffect(() => {
    if (!isAIPaletteOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      // 드래그 중이거나 패널 내부 클릭이면 무시
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        toggleAIPalette(false);
      }
    };

    window.addEventListener("pointerdown", handleClickOutside);
    return () => window.removeEventListener("pointerdown", handleClickOutside);
  }, [isAIPaletteOpen, toggleAIPalette]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResponse(null);

    // Build OS Context
    const openApps = windows.map(w => w.appId);
    let vfsFolders = [];
    try {
      const rootItems = await vfs.listFolder("");
      vfsFolders = rootItems.map(item => item.name);
    } catch (e) {}

    const osContext = {
      openApps,
      vfsRootFolders: vfsFolders
    };

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query, osContext, source: "palette" }) // 팔레트 출처 명시
      });

      const data = await res.json();
      setIsLoading(false);
      
      if (data.error) {
        setResponse(`Error: ${data.error}`);
        return;
      }
      
      setResponse(data.response);

      // Execute AI Function Calls (The "Hands" of the OS)
      if (data.action && data.action.type !== "NONE") {
        const { type, payload } = data.action;
        
        if (type === "OPEN_APP") {
          openWindow(payload.appId.toLowerCase(), payload.appId.toUpperCase(), "widgets", undefined, payload.payload);
        } 
        else if (type === "CREATE_FILE") {
          // ensure parent folder exists
          const parts = payload.path.split("/");
          const fileName = parts.pop();
          const parentPath = parts.join("/") || "";
          
          try {
            await vfs.ensureRootFolders();
            await vfs.createFile(fileName, parentPath, payload.content || "");
            // Notify user
            openWindow("explorer", "File Explorer", "folder");
          } catch (err: any) {
             console.error("VFS Create Error:", err);
          }
        }
      }

    } catch (error) {
      console.error("AI API Error:", error);
      setIsLoading(false);
      setResponse(t.ai_network_error);
    }
  };

  const continueInMessenger = () => {
    if (!query || !response) return;
    const newSession = {
      id: crypto.randomUUID(),
      title: query.slice(0, 20) + (query.length > 20 ? "..." : ""),
      messages: [
        { id: crypto.randomUUID(), sender: "user", text: query, timestamp: Date.now() - 1000 },
        { id: crypto.randomUUID(), sender: "ai", text: response, timestamp: Date.now() }
      ],
      updatedAt: Date.now()
    };
    const saved = localStorage.getItem("magicos_chat_sessions");
    let parsed = [];
    if (saved) {
      try { parsed = JSON.parse(saved); } catch(e){}
    }
    parsed.unshift(newSession);
    localStorage.setItem("magicos_chat_sessions", JSON.stringify(parsed));
    
    // Notify MessengerApp
    window.dispatchEvent(new Event("sync_magicos_sessions"));
    
    // Switch to expanded mode
    toggleAIPalette(true, 'expanded');
  };

  if (!isAIPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <motion.div 
        ref={paletteRef}
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragConstraints={{ top: 24 }} // 상태표시줄(24px) 위로 올라가는 것 방지
        style={{ x, y }}
        className={`absolute bg-white/10 backdrop-blur-3xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col pointer-events-auto
          ${isExpanded ? 'rounded-2xl' : 'rounded-2xl'}
        `}
        animate={{
          width: isExpanded ? 850 : 320,
          height: isExpanded ? 650 : 'auto',
          borderRadius: 16
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {isExpanded ? (
          <div className="w-full h-full relative flex flex-col">
            {/* 넓고 투명한 중앙 헤더 드래그 영역 (확장 모드) */}
            <div 
              className="absolute top-0 left-16 right-32 h-14 z-[60] cursor-grab active:cursor-grabbing flex justify-center items-center"
              onPointerDown={(e) => dragControls.start(e)}
              title="여기를 잡아 끌어서 이동하세요"
            >
              <div className="w-16 h-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors" />
            </div>

            <div className="absolute top-2 right-3 flex items-center gap-2 z-50">
              <button onClick={() => toggleAIPalette(true, 'compact')} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 transition-colors" title="축소 (포인터 모드)">
                <span className="material-symbols-rounded text-[18px]">close_fullscreen</span>
              </button>
              <button onClick={() => toggleAIPalette(false)} className="w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-600 flex items-center justify-center text-white transition-colors" title="닫기 (ESC)">
                <span className="material-symbols-rounded text-[18px]">close</span>
              </button>
            </div>
            <MessengerApp />
          </div>
        ) : (
          <div className="relative flex flex-col">
            {/* 시각적 드래그 핸들 바 (포인터 모드) */}
            <div 
              className="w-full h-5 bg-white/5 border-b border-white/5 flex justify-center items-center cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors"
              onPointerDown={(e) => dragControls.start(e)}
              title="여기를 잡아 끌어서 이동하세요"
            >
              <div className="w-12 h-1 rounded-full bg-white/20" />
            </div>

            <form onSubmit={handleSubmit} className="flex items-center px-3 py-2 border-b border-white/10 gap-2 bg-black/40">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] flex items-center justify-center shrink-0">
                <span className={`material-symbols-rounded text-white text-[14px] ${isLoading ? 'animate-spin' : ''}`}>
                  {isLoading ? 'hourglass_empty' : 'auto_awesome'}
                </span>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isLoading}
                placeholder={t.ai_command_placeholder || "어떤 마법을 부려볼까요?"}
                className="flex-1 bg-transparent text-white text-[13px] outline-none placeholder-slate-400 font-sans cursor-none"
              />
              <Magnetic 
                as="button" 
                type="button"
                onClick={() => {
                  if (query && response) {
                    continueInMessenger();
                  } else {
                    toggleAIPalette(true, 'expanded');
                  }
                }} 
                radius="8px" 
                className="p-1 rounded-lg hover:bg-white/10 transition-colors text-slate-400" 
                title="채팅창으로 크게 보기"
              >
                <span className="material-symbols-rounded text-[18px]">open_in_full</span>
              </Magnetic>
              <Magnetic as="button" radius="8px" className="p-1 rounded-lg hover:bg-white/10 transition-colors text-slate-400" type="submit">
                <span className="material-symbols-rounded text-[18px]">send</span>
              </Magnetic>
            </form>

            {/* AI Response Area */}
            {(response || isLoading) && (
              <div className="p-4 bg-black/60 text-slate-200 text-[12px] leading-relaxed font-sans border-t border-white/5 backdrop-blur-xl">
                {isLoading ? (
                  <div className="flex flex-col gap-2 animate-pulse">
                    <div className="h-3 bg-white/10 rounded w-3/4"></div>
                    <div className="h-3 bg-white/10 rounded w-1/2"></div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <p>{response}</p>
                    <button 
                      onClick={continueInMessenger}
                      className="self-end px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] rounded-md transition-colors flex items-center gap-1.5"
                    >
                      대화 이어가기 <span className="material-symbols-rounded text-[14px]">arrow_outward</span>
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <div className="px-3 py-1.5 bg-black/80 text-[9px] text-slate-500 font-mono flex justify-between uppercase tracking-widest">
              <span>{t.ai_magic_pointer}</span>
              <span>{t.ai_esc_close}</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
