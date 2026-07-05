import React from 'react';

interface Ticker {
  symbol: string;
  name: string;
}

interface StockSidebarProps {
  tickers: Ticker[];
  selectedTicker: string;
  setSelectedTicker: (ticker: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: (e: React.FormEvent) => void;
  t: any;
}

export default function StockSidebar({
  tickers,
  selectedTicker,
  setSelectedTicker,
  searchQuery,
  setSearchQuery,
  onSearch,
  t
}: StockSidebarProps) {
  return (
    <div className="w-64 border-r border-black/10 dark:border-white/10 bg-slate-50 dark:bg-[#252528] flex flex-col shrink-0">
      <div className="p-4 border-b border-black/10 dark:border-white/10">
        <h2 className="font-bold text-lg mb-3">{t.app_stock || "Stocks"}</h2>
        <form onSubmit={onSearch} className="flex gap-2">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company (e.g. Apple)" 
            className="flex-1 bg-black/5 dark:bg-white/10 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-2 ring-blue-500 transition-shadow"
          />
        </form>
      </div>
      <div className="flex-1 overflow-y-auto">
        {tickers.map((ticker) => (
          <button
            key={ticker.symbol}
            onClick={() => setSelectedTicker(ticker.symbol)}
            className={`w-full text-left px-4 py-3 border-b border-black/5 dark:border-white/5 transition-colors ${
              selectedTicker === ticker.symbol 
                ? "bg-blue-50 dark:bg-blue-900/30 border-l-4 border-l-blue-500" 
                : "hover:bg-black/5 dark:hover:bg-white/5 border-l-4 border-l-transparent"
            }`}
          >
            <div className="font-semibold text-sm">{ticker.symbol}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{ticker.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
