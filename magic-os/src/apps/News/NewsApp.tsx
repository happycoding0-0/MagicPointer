"use client";

import { useState, useEffect, useRef } from "react";
import { useWindowStore } from "@/store/useWindowStore";
import { dictionary } from "@/locales/dictionary";
import BaseAppWrapper from "@/components/BaseAppWrapper";
import useSWR from "swr";
import NewsReader from "./NewsReader";

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface Article {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

export default function NewsApp() {
  const { systemLanguage, setOSContext, windows, setWindowPayload } = useWindowStore();
  const t = dictionary[systemLanguage];
  
  const [activeTab, setActiveTab] = useState<'global' | 'korea' | 'search'>('korea');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  const [aiSummary, setAiSummary] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const autoSummarizeRef = useRef(false);

  // Dynamic SWR URL
  let swrUrl = `/api/news?category=${activeTab}`;
  if (activeTab === 'search' && activeQuery) {
    swrUrl = `/api/news?q=${encodeURIComponent(activeQuery)}`;
  }

  const { data, error, isLoading } = useSWR(swrUrl, fetcher);
  const articles: Article[] = data?.articles || [];

  const myWindow = windows.find(w => w.id === 'news');
  const aiPayload = myWindow?.payload;

  useEffect(() => {
    if (aiPayload && typeof aiPayload === 'string') {
      const query = aiPayload.trim();
      setSearchQuery(query);
      setActiveQuery(query);
      setActiveTab('search');
      setAiSummary(""); // Reset summary
      autoSummarizeRef.current = true; // AI가 호출했으므로 자동 요약 예약
      setWindowPayload('news', undefined);
    }
  }, [aiPayload, setWindowPayload]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setActiveQuery(searchQuery.trim());
    setActiveTab('search');
    setAiSummary("");
  };

  // Broadcast articles to OS Context
  // 무한 루프 방지를 위해 의존성 배열에 원시 타입(문자열)을 사용합니다.
  const contextDeps = JSON.stringify({ tab: activeTab, query: activeQuery, len: articles.length });
  useEffect(() => {
    if (articles.length > 0) {
      setOSContext({
        app: "news",
        category: activeTab,
        query: activeQuery,
        articles: articles.slice(0, 10).map(a => a.title)
      });
      
      // 예약된 자동 요약이 있고 로딩이 끝났다면 실행
      if (autoSummarizeRef.current && !isLoading) {
        autoSummarizeRef.current = false;
        generateSummary();
      }
    }
    return () => setOSContext(null);
  }, [contextDeps, setOSContext, isLoading]);

  const generateSummary = async () => {
    if (articles.length === 0) return;
    setIsSummarizing(true);
    setAiSummary("");
    
    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articles, query: activeQuery })
      });
      
      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const textChunk = decoder.decode(value, { stream: true });
        setAiSummary(prev => prev + textChunk);
      }
    } catch (err) {
      console.error(err);
      setAiSummary("요약을 불러오는데 실패했습니다.");
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <BaseAppWrapper flexCol className="relative">
      
      {/* Top Bar */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-[#161618]/80 backdrop-blur-xl shrink-0 z-10 gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <span className="material-symbols-rounded text-blue-500 text-2xl">newspaper</span>
          <span className="font-bold text-lg tracking-wide hidden sm:block">{t.app_news || "Daily News"}</span>
        </div>
        
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
          <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search news... (e.g., Apple, Tesla)"
            className="w-full bg-slate-100 dark:bg-white/5 border border-transparent focus:border-blue-500/50 rounded-full py-1.5 pl-9 pr-4 text-sm outline-none transition-all"
          />
        </form>

        <div className="flex bg-black/5 dark:bg-white/5 rounded-xl p-1 shrink-0">
          <button 
            onClick={() => { setActiveTab('global'); setActiveQuery(""); setSearchQuery(""); setAiSummary(""); }}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${activeTab === 'global' ? 'bg-white dark:bg-[#2a2a30] shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            {t.news_tab_global || "Global"}
          </button>
          <button 
            onClick={() => { setActiveTab('korea'); setActiveQuery(""); setSearchQuery(""); setAiSummary(""); }}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${activeTab === 'korea' ? 'bg-white dark:bg-[#2a2a30] shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            {t.news_tab_korea || "Korea"}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
        {/* AI Briefing Panel */}
        {articles.length > 0 && !isLoading && (
          <div className="max-w-6xl mx-auto mb-6">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold">
                  <span className="material-symbols-rounded">magic_button</span>
                  <span>AI 요약 브리핑</span>
                </div>
                {!aiSummary && !isSummarizing && (
                  <button 
                    onClick={generateSummary}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full transition-colors shadow-sm flex items-center gap-1"
                  >
                    <span className="material-symbols-rounded text-sm">bolt</span>
                    지금 요약하기
                  </button>
                )}
              </div>
              
              {isSummarizing && !aiSummary && (
                <div className="flex items-center gap-2 text-slate-500 text-sm animate-pulse">
                  <span className="material-symbols-rounded animate-spin text-sm">sync</span>
                  뉴스를 읽고 분석하는 중...
                </div>
              )}
              
              {aiSummary && (
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {aiSummary}
                </div>
              )}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-4">
            <div className="w-10 h-10 border-4 border-black/10 dark:border-white/10 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-slate-500 text-sm animate-pulse">{t.news_loading || "Fetching the latest headlines..."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {articles.map((article) => (
              <div 
                key={article.id} 
                onClick={() => setSelectedArticle(article)}
                className="bg-white dark:bg-[#1a1a1d] rounded-2xl p-5 border border-black/5 dark:border-white/5 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between h-40"
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">{article.source}</span>
                  </div>
                  <h2 className="text-base font-bold leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-3">
                    {article.title}
                  </h2>
                </div>
                <div className="mt-4 text-xs text-slate-400 font-medium">
                  {article.pubDate ? new Date(article.pubDate).toLocaleString() : ''}
                </div>
              </div>
            ))}
            {articles.length === 0 && !isLoading && (
              <div className="col-span-full py-10 text-center text-slate-500">
                검색된 뉴스가 없습니다.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Native Reader Mode Overlay */}
      {selectedArticle && (
        <NewsReader 
          article={selectedArticle} 
          onClose={() => setSelectedArticle(null)} 
          t={t} 
        />
      )}
    </BaseAppWrapper>
  );
}
