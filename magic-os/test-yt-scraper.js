

const test = async () => {
  const query = 'iu';
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const response = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  const html = await response.text();

  const match = html.match(/var ytInitialData = (\{.*?\});<\/script>/);
  if (match && match[1]) {
    try {
      const data = JSON.parse(match[1]);
      const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
      if (!contents) {
        console.log("No contents found");
        return;
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
      console.log("Found", videos.length, "videos");
      console.log(videos.slice(0, 3));
    } catch (e) {
      console.error("Parse error", e);
    }
  } else {
    console.log("ytInitialData not found");
  }
};
test();
