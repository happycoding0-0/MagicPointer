"use client";

import { useEffect, useState } from "react";
import Magnetic from "@/components/ui/Magnetic";
import { useWindowStore } from "@/store/useWindowStore";
import { dictionary } from "@/locales/dictionary";

export default function StatusBar() {
  const [time, setTime] = useState("");
  const { systemLanguage } = useWindowStore();
  const t = dictionary[systemLanguage];

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const locale = systemLanguage === 'ko' ? 'ko-KR' : 'en-US';
      const formatter = new Intl.DateTimeFormat(locale, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      setTime(formatter.format(now));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [systemLanguage]);

  return (
    <header className="fixed top-0 left-0 w-full h-11 glass-panel flex items-center justify-between px-6 z-[999]">
      <div className="flex items-center gap-3">
        <span className="material-symbols-rounded text-blue-400 text-xl">blur_on</span>
        <span className="font-heading font-bold text-[0.9rem] tracking-wide text-white/90">MagicOS <span className="font-normal text-white/50">Core</span></span>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs text-slate-300 ml-2">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full status-dot-pulse"></span>
          {(t as any).status_online || "System Online"}
        </div>
      </div>
      
      {/* Absolute Centering for Time */}
      <div className="absolute left-1/2 -translate-x-1/2 font-heading text-sm font-medium text-white/90 tracking-wide pointer-events-none">
        {time || "Loading..."}
      </div>
      <div className="flex items-center gap-2">
        {/* Removed dummy icons for better UX immersion */}
      </div>
    </header>
  );
}
