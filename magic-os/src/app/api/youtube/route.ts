import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    // 1. YouTube 검색 페이지 HTML을 가져옵니다.
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const html = await response.text();

    // 2. 정규식을 사용하여 ytInitialData JSON을 추출합니다.
    const match = html.match(/var ytInitialData = (\{.*?\});<\/script>/);
    
    if (match && match[1]) {
      const data = JSON.parse(match[1]);
      const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
      
      if (!contents) {
        return NextResponse.json({ error: 'No contents found' }, { status: 404 });
      }
      
      let videos = [];
      for (const section of contents) {
        if (section.itemSectionRenderer?.contents) {
          for (const item of section.itemSectionRenderer.contents) {
            if (item.videoRenderer) {
              const vr = item.videoRenderer;
              videos.push({
                videoId: vr.videoId,
                title: vr.title?.runs?.[0]?.text || "No Title",
                thumbnail: vr.thumbnail?.thumbnails?.[vr.thumbnail.thumbnails.length - 1]?.url || "",
                channel: vr.ownerText?.runs?.[0]?.text || "Unknown",
                views: vr.viewCountText?.simpleText || ""
              });
            }
          }
        }
      }
      
      return NextResponse.json({ videos: videos.slice(0, 15) });
    } else {
      return NextResponse.json({ error: 'ytInitialData not found' }, { status: 404 });
    }
  } catch (error) {
    console.error("Youtube API Error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
