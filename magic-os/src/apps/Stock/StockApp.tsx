import { useState, useEffect } from "react";
import { useWindowStore } from "@/store/useWindowStore";
import { dictionary } from "@/locales/dictionary";
import useSWR from "swr";
import { toast } from "react-hot-toast";
import BaseAppWrapper from "@/components/BaseAppWrapper";
import StockSidebar from "./StockSidebar";
import StockChart from "./StockChart";

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
});

const INITIAL_TICKERS = [
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^IXIC", name: "NASDAQ" },
  { symbol: "AAPL", name: "Apple" },
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "BTC-USD", name: "Bitcoin" },
];

export default function StockApp() {
  const { systemLanguage, setOSContext, windows, setWindowPayload } = useWindowStore();
  const t = dictionary[systemLanguage];
  const [selectedTicker, setSelectedTicker] = useState("AAPL");
  const [tickers, setTickers] = useState(INITIAL_TICKERS);
  const [searchQuery, setSearchQuery] = useState("");

  const myWindow = windows.find(w => w.id === 'stock');
  const aiPayload = myWindow?.payload;

  const performSearch = async (query: string) => {
    const loadingToast = toast.loading(`Searching for "${query}"...`);
    try {
      const res = await fetch(`/api/stock/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      
      if (data.results && data.results.length > 0) {
        const topResult = data.results[0];
        const symbol = topResult.symbol;
        
        setTickers(prev => {
          if (!prev.find(t => t.symbol === symbol)) {
            return [{ symbol, name: topResult.name }, ...prev];
          }
          return prev;
        });
        setSelectedTicker(symbol);
        toast.success(`Found ${topResult.name}!`, { id: loadingToast });
      } else {
        toast.error(`No results found for "${query}"`, { id: loadingToast });
      }
    } catch (err) {
      toast.error("Search failed. Please try again.", { id: loadingToast });
    }
  };

  useEffect(() => {
    if (aiPayload && typeof aiPayload === 'string') {
      performSearch(aiPayload.trim());
      setWindowPayload('stock', undefined);
    }
  }, [aiPayload, setWindowPayload]);

  // SWR로 데이터 패칭 완벽하게 캐싱 처리
  const { data: stockData, error, isLoading: loading } = useSWR(
    selectedTicker ? `/api/stock?ticker=${selectedTicker}` : null,
    fetcher
  );

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.trim();
    setSearchQuery(""); // 즉시 비움
    performSearch(query);
  };

  // [Deep Action] Listen for AI commands
  useEffect(() => {
    const handleOpenStock = (e: any) => {
      if (e.detail && e.detail.ticker) {
        setSelectedTicker(e.detail.ticker);
      }
    };
    window.addEventListener("magicos:open-stock", handleOpenStock);
    return () => window.removeEventListener("magicos:open-stock", handleOpenStock);
  }, []);

  // Report context to OS only when data changes
  useEffect(() => {
    if (stockData && !error) {
      setOSContext({
        app: "stock",
        viewing: stockData.ticker,
        currentPrice: stockData.currentPrice,
        changePercent: stockData.changePercent,
      });
    }
    return () => setOSContext(null);
  }, [stockData, error, setOSContext]);

  return (
    <BaseAppWrapper className="relative">
      <StockSidebar 
        tickers={tickers}
        selectedTicker={selectedTicker}
        setSelectedTicker={setSelectedTicker}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
        t={t}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 flex items-center justify-center backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <span className="material-symbols-rounded animate-spin text-4xl text-blue-500">sync</span>
              <p className="font-medium animate-pulse">{t.stock_loading || "Loading market data..."}</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="flex-1 flex items-center justify-center flex-col text-red-500">
            <span className="material-symbols-rounded text-4xl mb-2">error</span>
            <p>{t.stock_error || "Failed to load market data."}</p>
          </div>
        )}

        {stockData && !error && (
          <StockChart stockData={stockData} t={t} />
        )}
      </div>
    </BaseAppWrapper>
  );
}
