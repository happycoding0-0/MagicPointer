"use client";

import { useEffect, useState, memo } from "react";
import { useWindowStore } from "@/store/useWindowStore";
import { dictionary } from "@/locales/dictionary";
import BaseAppWrapper from "@/components/BaseAppWrapper";

const MapComponent = memo(function MapComponent() {
  const { systemLanguage, setOSContext, windows, setWindowPayload } = useWindowStore();
  const t = dictionary[systemLanguage];
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("Seoul, South Korea"); // Default view
  const [loading, setLoading] = useState(false);
  const [cityInfo, setCityInfo] = useState<any>(null);

  useEffect(() => {
    return () => setOSContext(null); // Cleanup context on unmount
  }, [setOSContext]);

  // 구글 맵이 로드되었을 때 OS 문맥(Context)에 현재 위치 보고
  useEffect(() => {
    setOSContext({
      app: "map",
      location: activeQuery
    });
  }, [activeQuery, setOSContext]);

  const fetchCityInfo = async (query: string) => {
    try {
      // 한국어가 포함되어 있으면 한국어 위키피디아, 아니면 영어 위키피디아 사용
      const wikiLang = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(query) ? "ko" : "en";
      const res = await fetch(`https://${wikiLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        // Only show if it's a valid place/topic
        if (data.type !== "https://mediawiki.org/wiki/HyperSwitch/errors/not_found") {
          setCityInfo(data);
          return;
        }
      }
      setCityInfo(null);
    } catch(e) {
      setCityInfo(null);
    }
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      setActiveQuery(query);
      fetchCityInfo(query);
    } catch (err) {
      alert("Search failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const myWindow = windows.find(w => w.id === 'map');
  const aiPayload = myWindow?.payload;

  useEffect(() => {
    if (aiPayload && typeof aiPayload === 'string') {
      setSearchQuery(aiPayload);
      performSearch(aiPayload);
      setWindowPayload('map', undefined);
    }
  }, [aiPayload, setWindowPayload]);

  return (
    <BaseAppWrapper className="relative" bgOverride="bg-[#0f172a]">
      
      {/* Search Bar Overlay */}
      <div className="absolute top-4 left-4 z-20 w-80">
        <form onSubmit={handleSearch} className="relative flex items-center shadow-lg rounded-full overflow-hidden bg-white/90 dark:bg-[#252528]/90 backdrop-blur-md border border-black/10 dark:border-white/10 transition-shadow hover:shadow-xl">
          <span className="material-symbols-rounded absolute left-4 text-slate-400">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.map_search_placeholder || "Search location... (e.g. Tokyo)"}
            className="w-full pl-12 pr-12 py-3 bg-transparent outline-none text-black dark:text-white placeholder:text-slate-400 text-sm font-medium"
          />
          {loading && (
            <span className="material-symbols-rounded absolute right-4 text-green-500 animate-spin">sync</span>
          )}
        </form>
      </div>

      {/* Wikipedia Briefing Side Panel */}
      <div className={`absolute top-0 right-0 h-full w-80 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-l border-white/20 z-20 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-2xl ${cityInfo ? 'translate-x-0' : 'translate-x-full'}`}>
        {cityInfo && (
          <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
            {cityInfo.thumbnail?.source ? (
              <div className="w-full h-48 relative">
                <img src={cityInfo.thumbnail.source} alt={cityInfo.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <h2 className="absolute bottom-4 left-6 text-3xl font-bold text-white drop-shadow-md">{cityInfo.title}</h2>
                <button onClick={() => setCityInfo(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors">
                  <span className="material-symbols-rounded text-sm">close</span>
                </button>
              </div>
            ) : (
              <div className="p-6 pb-2 relative">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{cityInfo.title}</h2>
                <button onClick={() => setCityInfo(null)} className="absolute top-6 right-4 w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white flex items-center justify-center hover:bg-slate-300 dark:hover:bg-white/20 transition-colors">
                  <span className="material-symbols-rounded text-sm">close</span>
                </button>
              </div>
            )}
            
            <div className="p-6 pt-4 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
              <p className="mb-4">{cityInfo.extract}</p>
              {cityInfo.description && (
                <div className="inline-block px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-xs font-semibold mb-4">
                  {cityInfo.description}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Google Maps Embed iframe */}
      <div className="w-full h-full z-10 relative bg-[#e5e3df]">
        {/* Pointer events are enabled, this is a fully interactive Google Map */}
        <iframe 
          title="Google Maps"
          width="100%" 
          height="100%" 
          frameBorder="0" 
          style={{ border: 0 }} 
          src={`https://maps.google.com/maps?q=${encodeURIComponent(activeQuery)}&t=m&z=14&hl=ko&output=embed`}
          allowFullScreen
        ></iframe>
      </div>

    </BaseAppWrapper>
  );
});

export default MapComponent;
