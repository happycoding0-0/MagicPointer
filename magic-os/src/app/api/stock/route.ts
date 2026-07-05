import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=3mo`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      next: { revalidate: 60 } // Cache for 60 seconds
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];

    if (!result) {
      throw new Error("No data found for ticker");
    }

    const meta = result.meta;
    const timestamps = result.timestamp || [];
    const closePrices = result.indicators?.quote?.[0]?.close || [];

    // Format chart data for Recharts
    const chartData = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (closePrices[i] !== null && closePrices[i] !== undefined) {
        chartData.push({
          time: timestamps[i] * 1000, // Convert to ms
          price: Number(closePrices[i].toFixed(2)),
          date: new Date(timestamps[i] * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
      }
    }

    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.previousClose;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;

    return NextResponse.json({
      ticker: meta.symbol,
      name: meta.shortName || meta.longName || meta.symbol,
      currency: meta.currency,
      currentPrice: Number(currentPrice.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      chart: chartData
    });
    
  } catch (error) {
    console.error("Stock API Error:", error);
    return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 });
  }
}
