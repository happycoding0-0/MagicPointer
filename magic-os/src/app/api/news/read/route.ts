import { NextResponse } from 'next/server';
const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch article: ${response.status}`);
    }

    const html = await response.text();

    // JSDOM과 Mozilla Readability를 사용하여 본문을 완벽하게 추출
    const doc = new JSDOM(html, { url });
    const reader = new Readability(doc.window.document);
    const article = reader.parse();

    let paragraphs: string[] = [];

    if (article && article.content) {
      // Readability가 정리해준 HTML(article.content)에서 p 태그만 추출
      const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
      let match;
      while ((match = pRegex.exec(article.content)) !== null) {
        let text = match[1].replace(/<[^>]+>/g, '').trim();
        text = text.replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        if (text.length > 15) { 
          paragraphs.push(text);
        }
      }
    }

    // fallback: p태그가 없으면 textContent를 문단으로 쪼개기
    if (paragraphs.length === 0 && article && article.textContent) {
      paragraphs = article.textContent
        .split(/\n+/)
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 20);
    }

    // 3. Extract og:image for the cover image
    const imageMatch = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i);
    const imageUrl = imageMatch ? imageMatch[1] : null;

    // 4. Extract title using Readability first, fallback to og:title
    const titleMatch = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"/i);
    const ogTitle = titleMatch ? titleMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&apos;/g, "'").replace(/&#39;/g, "'").replace(/&#34;/g, '"').replace(/&hellip;/g, '…') : null;
    const title = (article && article.title) ? article.title : ogTitle;

    return NextResponse.json({ 
      title,
      text: paragraphs.length > 0 ? paragraphs.join('\n\n') : null,
      imageUrl
    });
  } catch (error) {
    console.error("News Reader API Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
