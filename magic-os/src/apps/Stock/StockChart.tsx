import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface StockChartProps {
  stockData: any;
  t: any;
}

export default function StockChart({ stockData, t }: StockChartProps) {
  if (!stockData) return null;
  
  return (
    <div className="p-8 flex flex-col h-full overflow-y-auto">
      {/* Header info */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{stockData.name || stockData.ticker}</h1>
        <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">{stockData.ticker}</div>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-light">
            {stockData.currency === "USD" ? "$" : stockData.currency === "KRW" ? "₩" : ""}
            {stockData.currency === "KRW" 
              ? Math.round(stockData.currentPrice).toLocaleString() 
              : stockData.currentPrice.toLocaleString()}
          </span>
          <span className={`text-lg font-medium flex items-center gap-1 ${
            stockData.change >= 0 ? "text-emerald-500" : "text-rose-500"
          }`}>
            <span className="material-symbols-rounded text-base">
              {stockData.change >= 0 ? "trending_up" : "trending_down"}
            </span>
            {stockData.change > 0 ? "+" : ""}{stockData.change} ({stockData.changePercent > 0 ? "+" : ""}{stockData.changePercent}%)
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={stockData.chart}>
            <XAxis 
              dataKey="date" 
              stroke="rgba(150,150,150,0.5)" 
              tick={{ fontSize: 12, fill: 'currentColor' }} 
              tickLine={false} 
              axisLine={false} 
              minTickGap={30}
            />
            <YAxis 
              domain={['auto', 'auto']} 
              stroke="rgba(150,150,150,0.5)" 
              tick={{ fontSize: 12, fill: 'currentColor' }} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(val) => stockData.currency === "KRW" ? `₩${Math.round(val).toLocaleString()}` : `$${val}`}
              width={70}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', background: '#1e293b', color: 'white' }}
              itemStyle={{ color: 'white', fontWeight: 'bold' }}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke={stockData.change >= 0 ? "#10b981" : "#f43f5e"} 
              strokeWidth={3} 
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex justify-between items-center text-sm text-slate-500">
        <span>{t.stock_chart_1m || "1M Chart"}</span>
        <span>Data provided by Yahoo Finance</span>
      </div>
    </div>
  );
}
