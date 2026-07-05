const test = async () => {
  try {
    const rss = await fetch('https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko');
    const xml = await rss.text();
    const linkMatch = xml.match(/<link>(https:\/\/news\.google\.com\/rss\/articles\/[^<]+)<\/link>/);
    if (!linkMatch) return console.log("No link found in RSS");
    
    const articleUrl = linkMatch[1];
    console.log("Found Google News URL:", articleUrl);

    const articleRes = await fetch(articleUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    
    const html = await articleRes.text();
    console.log("Article HTML length:", html.length);
    if (html.length < 5000) {
      console.log("HTML snippet:", html.substring(0, 500));
    }
  } catch (e) {
    console.error(e);
  }
}
test();
