import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  // 야후 파이낸스가 한글 검색을 지원하지 않으므로 자체 매핑 사전을 활용합니다.
  const KOREAN_STOCKS: Record<string, { symbol: string; name: string }> = {
    "삼성전자": { symbol: "005930.KS", name: "삼성전자" },
    "SK하이닉스": { symbol: "000660.KS", name: "SK하이닉스" },
    "LG에너지솔루션": { symbol: "373220.KS", name: "LG에너지솔루션" },
    "삼성바이오로직스": { symbol: "207940.KS", name: "삼성바이오로직스" },
    "현대차": { symbol: "005380.KS", name: "현대자동차" },
    "현대자동차": { symbol: "005380.KS", name: "현대자동차" },
    "기아": { symbol: "000270.KS", name: "기아" },
    "기아차": { symbol: "000270.KS", name: "기아" },
    "셀트리온": { symbol: "068270.KS", name: "셀트리온" },
    "포스코": { symbol: "005490.KS", name: "POSCO홀딩스" },
    "네이버": { symbol: "035420.KS", name: "NAVER" },
    "카카오": { symbol: "035720.KS", name: "카카오" },
    "LG화학": { symbol: "051910.KS", name: "LG화학" },
    "삼성SDI": { symbol: "006400.KS", name: "삼성SDI" },
    "에코프로비엠": { symbol: "247540.KQ", name: "에코프로비엠" },
    "에코프로": { symbol: "086520.KQ", name: "에코프로" },
  };

  const cleanQ = q.trim().replace(/\s+/g, ""); // 띄어쓰기 무시
  let localMatch = null;
  for (const [key, val] of Object.entries(KOREAN_STOCKS)) {
    if (cleanQ.includes(key) || key.includes(cleanQ)) {
      localMatch = val;
      break;
    }
  }

  try {
    if (localMatch) {
      return NextResponse.json({
        results: [{ symbol: localMatch.symbol, name: localMatch.name, exchDisp: "KSE" }]
      });
    }

    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=5&newsCount=0`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    if (!response.ok) {
      throw new Error(`Yahoo Search API error: ${response.status}`);
    }

    const data = await response.json();
    const quotes = data.quotes || [];

    return NextResponse.json({
      results: quotes.map((q: any) => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        exchDisp: q.exchDisp
      }))
    });
    
  } catch (error) {
    console.error("Stock Search API Error:", error);
    return NextResponse.json({ error: 'Failed to search stock' }, { status: 500 });
  }
}
