"use client";

import { useWindowStore } from "@/store/useWindowStore";
import { dictionary } from "@/locales/dictionary";

export default function SettingsApp() {
  const { systemLanguage, setLanguage } = useWindowStore();
  const t = dictionary[systemLanguage];

  return (
    <div className="w-full h-full bg-[#1e1e1e] text-slate-200 p-6 flex flex-col gap-8 overflow-y-auto">
      
      <div>
        <h2 className="text-2xl font-bold mb-2 text-white flex items-center gap-2">
          <span className="material-symbols-rounded text-blue-400">settings</span>
          {t.settings_title}
        </h2>
        <p className="text-sm text-slate-400">Manage your system preferences and behaviors.</p>
      </div>

      {/* Language Setting */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-1">
              <span className="material-symbols-rounded text-slate-400">language</span>
              {t.settings_language}
            </h3>
            <p className="text-sm text-slate-400">
              {t.settings_language_desc}
            </p>
          </div>
          
          <div className="flex items-center bg-black/40 rounded-lg p-1">
            <button
              onClick={() => setLanguage('en')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                systemLanguage === 'en' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              🇺🇸 English
            </button>
            <button
              onClick={() => setLanguage('ko')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                systemLanguage === 'ko' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              🇰🇷 한국어
            </button>
          </div>
        </div>
      </div>

      {/* Placeholder for future settings */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex items-center justify-center text-slate-500 opacity-50">
        <p className="text-sm">More settings coming soon...</p>
      </div>

    </div>
  );
}
