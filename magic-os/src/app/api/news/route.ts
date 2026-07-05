import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'korea';
  const q = searchParams.get('q');

  // News RSS URLs
  let rssUrl = '';
  if (q) {
    rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=ko&gl=KR&ceid=KR:ko`;
  } else {
    rssUrl = category === 'global' 
      ? 'http://feeds.bbci.co.uk/news/world/rss.xml'
      : 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=01&plink=RSSREADER';
  }

  try {
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS: ${response.status}`);
    }

    const xml = await response.text();

    // 정규식을 사용한 초경량 XML 파싱 (외부 라이브러리 불필요)
    const items: any[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && items.length < 20) {
      const itemXml = match[1];
      
      const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const sourceMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/);

      if (titleMatch && linkMatch) {
        // Remove CDATA wrappers if they exist
        const cleanData = (str: string) => str.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
        
        let sourceName = 'Google News';
        if (category === 'korea') sourceName = 'SBS News';
        else if (sourceMatch) sourceName = cleanData(sourceMatch[1]);

        items.push({
          id: Math.random().toString(36).substr(2, 9),
          title: cleanData(titleMatch[1]).replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
          link: cleanData(linkMatch[1]),
          pubDate: pubDateMatch ? cleanData(pubDateMatch[1]) : '',
          source: sourceName,
        });
      }
    }

    return NextResponse.json({ articles: items });
  } catch (error) {
    console.error("News API Error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
