"use client";

import { useState, useEffect } from "react";
import { useWindowStore } from "@/store/useWindowStore";
import { dictionary } from "@/locales/dictionary";
import BaseAppWrapper from "@/components/BaseAppWrapper";

export default function BrowserApp() {
  const { systemLanguage } = useWindowStore();
  const t = dictionary[systemLanguage];
  
  // Google embedded mode bypass for iframes
  const [url, setUrl] = useState("https://www.google.com/webhp?igu=1");
  const [inputUrl, setInputUrl] = useState("https://www.google.com");
  
  const myWindow = useWindowStore(s => s.windows.find(w => w.id === 'browser'));
  const aiPayload = myWindow?.payload;

  useEffect(() => {
    if (aiPayload && typeof aiPayload === 'string') {
      let finalUrl = aiPayload.trim();
      if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
         if (!finalUrl.includes(".") || finalUrl.includes(" ")) {
            finalUrl = "https://www.google.com/search?igu=1&q=" + encodeURIComponent(finalUrl);
         } else {
            finalUrl = "https://" + finalUrl;
         }
      }
      setUrl(finalUrl);
      setInputUrl(finalUrl);
      useWindowStore.getState().setWindowPayload('browser', undefined);
    }
  }, [aiPayload]);
  
  const handleGo = (e: React.FormEvent) => {
    e.preventDefault();
    let finalUrl = inputUrl.trim();
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = "https://" + finalUrl;
    }
    setUrl(finalUrl);
    setInputUrl(finalUrl);
  };
  
  return (
    <BaseAppWrapper flexCol className="relative bg-white dark:bg-[#121212]">
      {/* Browser Toolbar */}
      <div className="h-14 flex items-center px-4 border-b border-black/5 dark:border-white/5 bg-[#f8f9fa] dark:bg-[#202124] shrink-0 gap-3">
        <div className="flex gap-1">
          <button className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors">
            <span className="material-symbols-rounded text-xl">arrow_back</span>
          </button>
          <button className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors">
            <span className="material-symbols-rounded text-xl">arrow_forward</span>
          </button>
          <button onClick={() => setUrl(url)} className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors">
            <span className="material-symbols-rounded text-xl">refresh</span>
          </button>
        </div>
        
        <form onSubmit={handleGo} className="flex-1 max-w-3xl flex items-center bg-white dark:bg-[#171717] border border-black/10 dark:border-white/10 rounded-full px-4 py-1.5 focus-within:ring-2 ring-blue-500 transition-shadow">
          <span className="material-symbols-rounded text-slate-400 text-sm mr-2">lock</span>
          <input 
            type="text" 
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-slate-800 dark:text-slate-200"
            placeholder="Search or enter web address"
          />
        </form>
      </div>
      
      {/* WebView */}
      <div className="flex-1 w-full bg-white dark:bg-black">
        <iframe 
          src={url}
          className="w-full h-full border-none bg-white"
          title="Browser"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>
    </BaseAppWrapper>
  );
}
