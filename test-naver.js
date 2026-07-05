const test = async () => {
  try {
    const res = await fetch('https://news.naver.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    // Naver News usually has article titles in strong tags or div tags with specific classes.
    // Let's just match any <a href="..." class="cjs_t">...</a> or similar.
    const match = html.match(/cjs_t[^>]*>(.*?)<\/div>/g);
    console.log(match ? match.slice(0, 5) : "Not found");
  } catch (e) {
    console.error(e);
  }
}
test();
