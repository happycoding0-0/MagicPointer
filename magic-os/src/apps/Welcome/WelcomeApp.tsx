"use client";

import { useWindowStore } from "@/store/useWindowStore";
import { dictionary } from "@/locales/dictionary";

export default function WelcomeApp() {
  const { toggleAIPalette, closeWindow, systemLanguage } = useWindowStore();
  const t = dictionary[systemLanguage];

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-[#1e1e1e] to-[#0f0f0f] text-slate-200 overflow-y-auto">
      <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-2xl mx-auto text-center">
        
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.4)] mb-8">
          <span className="material-symbols-rounded text-5xl text-white">auto_awesome</span>
        </div>

        <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          {t.welcome_title}
        </h1>
        
        <p className="text-lg text-slate-400 mb-10 leading-relaxed">
          {t.welcome_subtitle_1} <br />
          {t.welcome_subtitle_2}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-8">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-left flex flex-col gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
              <span className="material-symbols-rounded">keyboard</span>
            </div>
            <h3 className="text-lg font-semibold text-white">{t.welcome_shortcut_title || "Keyboard Shortcuts"}</h3>
            <p className="text-sm text-slate-400">
              {t.welcome_shortcut_desc || "Press Cmd/Ctrl + K to open the AI Palette anytime."}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-left flex flex-col gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
              <span className="material-symbols-rounded">chat</span>
            </div>
            <h3 className="text-lg font-semibold text-white">{t.welcome_nlp_title || "Natural Language"}</h3>
            <p className="text-sm text-slate-400">
              {t.welcome_nlp_desc || "Just talk to the OS. It will understand your intent."}
            </p>
          </div>
        </div>

        {/* ---------------- NEW: Apps Guide Section (Redesigned for Accessibility) ---------------- */}
        <div className="w-full text-left mb-10 space-y-6">
          <div className="border-b border-white/10 pb-3 flex items-center gap-2">
            <span className="material-symbols-rounded text-purple-400">menu_book</span>
            <h2 className="text-xl font-bold text-white">MagicOS 퀵 가이드</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
            
            {/* OS Card */}
            <div className="p-6 rounded-2xl bg-[#1e293b]/50 border border-white/10 hover:border-white/20 transition-colors shadow-lg flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center text-slate-300">
                  <span className="material-symbols-rounded">touch_app</span>
                </div>
                <h4 className="text-lg font-semibold text-white">OS 기본 조작</h4>
              </div>
              <ul className="text-slate-300 space-y-2 leading-relaxed ml-1">
                <li><b className="text-white">드래그 앤 드롭:</b> 바탕화면 앱을 자유롭게 이동</li>
                <li><b className="text-white">우클릭 메뉴:</b> 빈 공간 우클릭으로 테마 변경</li>
              </ul>
            </div>

            {/* News Card */}
            <div className="p-6 rounded-2xl bg-[#1e293b]/50 border border-white/10 hover:border-white/20 transition-colors shadow-lg flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <span className="material-symbols-rounded">newspaper</span>
                </div>
                <h4 className="text-lg font-semibold text-white">뉴스 앱</h4>
              </div>
              <p className="text-slate-300 leading-relaxed ml-1">
                글로벌, 한국, 테크 뉴스를 실시간 제공합니다. 기사를 클릭하면 광고 없는 <b className="text-blue-400">리더(Reader) 모드</b>가 켜집니다.
              </p>
            </div>

            {/* Stock Card */}
            <div className="p-6 rounded-2xl bg-[#1e293b]/50 border border-white/10 hover:border-white/20 transition-colors shadow-lg flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <span className="material-symbols-rounded">show_chart</span>
                </div>
                <h4 className="text-lg font-semibold text-white">주식 앱</h4>
              </div>
              <p className="text-slate-300 leading-relaxed ml-1">
                실시간 야후 파이낸스 차트 연동. 영문뿐 아니라 <b className="text-emerald-400">"삼성전자", "카카오"</b> 등 한글 종목 검색도 완벽 지원합니다.
              </p>
            </div>

            {/* Map Card */}
            <div className="p-6 rounded-2xl bg-[#1e293b]/50 border border-white/10 hover:border-white/20 transition-colors shadow-lg flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400">
                  <span className="material-symbols-rounded">map</span>
                </div>
                <h4 className="text-lg font-semibold text-white">스마트 지도</h4>
              </div>
              <p className="text-slate-300 leading-relaxed ml-1">
                고급 다크 타일 맵. <b className="text-green-400">"도쿄", "뉴욕"</b> 등을 검색해 보세요. 지도가 날아가며 <b>위키피디아 패널</b>이 등장합니다!
              </p>
            </div>

          </div>
        </div>
        {/* ------------------------------------------------------------------------- */}

        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => {
              closeWindow("welcome");
              toggleAIPalette(true);
            }}
            className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors shadow-lg shadow-purple-500/20 flex items-center gap-2"
          >
            <span className="material-symbols-rounded text-xl">auto_awesome</span>
            {t.welcome_btn_ai || "Activate AI"}
          </button>
          
          <button 
            onClick={() => closeWindow("welcome")}
            className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium transition-colors border border-white/10"
          >
            {t.welcome_btn_explore || "Explore OS"}
          </button>
        </div>
      </div>
    </div>
  );
}
