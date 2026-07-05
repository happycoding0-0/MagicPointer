import React from 'react';
import useSWR from 'swr';

interface Article {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

interface NewsReaderProps {
  article: Article;
  onClose: () => void;
  t: any;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }
  return res.json();
};

export default function NewsReader({ article, onClose, t }: NewsReaderProps) {
  const { data: readerContent, error, isLoading } = useSWR(
    article ? `/api/news/read?url=${encodeURIComponent(article.link)}` : null,
    fetcher
  );

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-[#fdfdfd] dark:bg-[#121214] animate-in slide-in-from-bottom-8 duration-300">
      
      {/* Reader Top Bar */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-[#161618]/80 backdrop-blur-xl shrink-0">
        <button onClick={onClose} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all text-sm font-medium">
          <span className="material-symbols-rounded text-lg">close</span>
          Close
        </button>
        <div className="flex items-center gap-3">
           <a href={article.link} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-sm font-medium">
             <span className="material-symbols-rounded text-lg">open_in_new</span>
             Original
           </a>
        </div>
      </div>

      {/* Reader Content */}
      <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full scroll-smooth">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 mt-20">
            <div className="w-10 h-10 border-4 border-black/10 dark:border-white/10 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-slate-500 text-sm animate-pulse">{t.news_reader_loading || "Extracting article content..."}</p>
          </div>
        ) : error ? (
           <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/50">
             <span className="material-symbols-rounded text-3xl mb-2">error</span>
             <p className="font-medium">기사를 불러오지 못했습니다.</p>
             <p className="text-sm mt-2 opacity-80">{error.message || "Network Error"}</p>
             <p className="text-sm mt-4">우측 상단의 'Original' 버튼을 눌러 원본 사이트에서 확인해 주세요.</p>
           </div>
        ) : readerContent ? (
          <div className="animate-in fade-in duration-500 pb-20">
            <p className="text-sm font-bold text-blue-500 mb-4">{article.source}</p>
            <h1 className="text-3xl md:text-4xl font-black leading-tight mb-6 font-serif tracking-tight">
              {readerContent.title || article.title}
            </h1>
            
            {readerContent.imageUrl && (
              <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black/5 mb-8 shadow-sm">
                <img src={readerContent.imageUrl} alt="Article cover" className="w-full h-full object-cover" />
              </div>
            )}
            
            <div className="font-serif leading-loose text-lg text-[#333] dark:text-[#d1d5db]">
              {readerContent.text ? (
                 readerContent.text.split('\n\n').map((paragraph: string, idx: number) => (
                   <p key={idx} className="mb-6">{paragraph}</p>
                 ))
              ) : (
                 <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/50">
                   <span className="material-symbols-rounded text-3xl mb-2">error</span>
                   <p className="font-medium">Failed to extract readable content from this site.</p>
                   <p className="text-sm mt-1">Please click the 'Original' button in the top right to view the article on the source website.</p>
                 </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
