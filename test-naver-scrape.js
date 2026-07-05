const fs = require('fs');
const test = async () => {
  try {
    const res = await fetch('https://news.naver.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    const html = await res.text();
    fs.writeFileSync('naver_news.html', html);
    console.log("Saved naver_news.html. Length:", html.length);
  } catch (e) {
    console.error(e);
  }
}
test();
