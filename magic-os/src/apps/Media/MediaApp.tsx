"use client";

import { useState, useEffect, useRef } from "react";
import { useWindowStore } from "@/store/useWindowStore";
import { dictionary } from "@/locales/dictionary";
import BaseAppWrapper from "@/components/BaseAppWrapper";

interface VideoItem {
  videoId: string;
  title: string;
  thumbnail: string;
  channel: string;
  views: string;
}

export default function MediaApp() {
  const { systemLanguage } = useWindowStore();
  const t = dictionary[systemLanguage];
  
  const [query, setQuery] = useState("lofi jazz vibes");
  const [searchInput, setSearchInput] = useState("");
  const [videoList, setVideoList] = useState<VideoItem[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const autoPlayNextSearch = useRef(false);

  const myWindow = useWindowStore(s => s.windows.find(w => w.id === 'media'));
  const aiPayload = myWindow?.payload;

  useEffect(() => {
    if (aiPayload && typeof aiPayload === 'string') {
      setQuery(aiPayload);
      setSearchInput(aiPayload);
      autoPlayNextSearch.current = true;
      useWindowStore.getState().setWindowPayload('media', undefined);
    }
  }, [aiPayload]);

  // query가 변경될 때마다 백엔드 API를 호출하여 검색 결과를 가져옵니다.
  useEffect(() => {
    if (!query) return;
    
    let isMounted = true;
    const fetchVideos = async () => {
      setIsSearching(true);
      setVideoList([]);
      setSelectedVideo(null); // 검색 시 플레이어 닫기
      try {
        const res = await fetch(`/api/youtube?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (isMounted && data.videos) {
          setVideoList(data.videos);
          if (autoPlayNextSearch.current && data.videos.length > 0) {
            setSelectedVideo(data.videos[0]);
            autoPlayNextSearch.current = false;
          }
        }
      } catch (e) {
        console.error("YouTube search error", e);
      } finally {
        if (isMounted) setIsSearching(false);
      }
    };
    
    fetchVideos();
    return () => { isMounted = false; };
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setQuery(searchInput);
    }
  };

  const handleCategoryClick = (categoryQuery: string) => {
    setQuery(categoryQuery);
    setSearchInput("");
  };

  return (
    <BaseAppWrapper bgOverride="bg-[#0f0f11]" className="text-white relative">
      
      {/* Sidebar */}
      <div className="w-60 bg-[#161618] border-r border-white/5 flex flex-col shrink-0">
        <div className="p-5 flex items-center gap-2 border-b border-white/5 shrink-0">
          <span className="material-symbols-rounded text-red-500 text-2xl">play_circle</span>
          <span className="font-bold text-lg tracking-wide">{t.app_media || "Media Player"}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-2">Discover</p>
          
          <button onClick={() => handleCategoryClick("trending now")} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-colors text-sm font-medium w-full text-left">
            <span className="material-symbols-rounded text-[20px] text-orange-400">local_fire_department</span>
            {t.media_trending || "Trending"}
          </button>
          
          <button onClick={() => handleCategoryClick("popular music videos")} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-colors text-sm font-medium w-full text-left">
            <span className="material-symbols-rounded text-[20px] text-pink-400">music_note</span>
            {t.media_music || "Music"}
          </button>
          
          <button onClick={() => handleCategoryClick("best gaming videos")} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-colors text-sm font-medium w-full text-left">
            <span className="material-symbols-rounded text-[20px] text-purple-400">sports_esports</span>
            {t.media_gaming || "Gaming"}
          </button>

          <button onClick={() => handleCategoryClick("breaking news")} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-colors text-sm font-medium w-full text-left">
            <span className="material-symbols-rounded text-[20px] text-blue-400">newspaper</span>
            {t.media_news || "News"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        
        {/* Top Bar (Search) */}
        <div className="h-16 flex items-center px-6 border-b border-white/5 bg-[#0f0f11]/80 backdrop-blur-xl shrink-0 z-10">
          <form onSubmit={handleSearch} className="relative w-full max-w-md group">
            <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg transition-colors group-focus-within:text-white">search</span>
            <input 
              type="text" 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t.media_search_placeholder || "Search YouTube..."}
              className="w-full bg-[#202024] text-white text-sm rounded-full py-2.5 pl-10 pr-4 outline-none border border-white/5 focus:border-white/20 focus:bg-[#2a2a30] transition-all placeholder-slate-500"
            />
          </form>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative bg-[#0f0f11] overflow-hidden">
          {selectedVideo ? (
            /* Player Mode */
            <div className="absolute inset-0 z-20 flex flex-col bg-black animate-in fade-in zoom-in-95 duration-300">
              {/* Player Top Bar */}
              <div className="h-14 flex items-center px-4 shrink-0 bg-gradient-to-b from-black/80 to-transparent absolute top-0 w-full z-30 opacity-0 hover:opacity-100 transition-opacity">
                <button onClick={() => setSelectedVideo(null)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/50 hover:bg-white/20 backdrop-blur-md text-white transition-all text-sm font-medium">
                  <span className="material-symbols-rounded text-lg">arrow_back</span>
                  Back to Search
                </button>
              </div>
              <div className="flex-1 w-full h-full flex items-center justify-center bg-black relative">
                <div className="w-full h-full bg-black">
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1`}
                    title="YouTube Media Player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </div>
          ) : (
            /* Grid View Mode */
            <div className="w-full h-full overflow-y-auto p-6 scroll-smooth">
              {isSearching ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="w-10 h-10 border-4 border-white/10 border-t-red-500 rounded-full animate-spin"></div>
                  <p className="text-slate-400 text-sm animate-pulse">Searching YouTube...</p>
                </div>
              ) : videoList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8 pb-10">
                  {videoList.map((v) => (
                    <div key={v.videoId} onClick={() => setSelectedVideo(v)} className="cursor-pointer group flex flex-col gap-3">
                      <div className="w-full aspect-video rounded-xl overflow-hidden bg-[#1a1a1d] relative shadow-lg">
                        <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                          <span className="material-symbols-rounded text-white text-5xl opacity-0 group-hover:opacity-100 drop-shadow-lg scale-75 group-hover:scale-100 transition-all duration-300">play_circle</span>
                        </div>
                      </div>
                      <div className="px-1">
                        <h3 className="text-sm font-medium text-slate-200 line-clamp-2 leading-snug group-hover:text-red-400 transition-colors" title={v.title}>{v.title}</h3>
                        <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500 font-medium">
                          <span className="truncate hover:text-slate-300 transition-colors">{v.channel}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-700 shrink-0"></span>
                          <span className="whitespace-nowrap">{v.views}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
                  <span className="material-symbols-rounded text-5xl opacity-30">search_off</span>
                  <p>No results found for "{query}"</p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </BaseAppWrapper>
  );
}
