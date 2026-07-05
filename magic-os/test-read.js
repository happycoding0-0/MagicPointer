const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');

const test = async () => {
  const url = 'https://news.google.com/rss/articles/CBMib0FVX3lxTE5ZMkw4TFBYczVMOHVPcWR0anZrM3pKWWZpYWFXMVJwRXBMeUdXdWNSVkswYmlCWlhFSm5qX3FxV1J4YTlTYTlndU00RTkzeFExSHdkN1NmbkRrYjNGZmNnLVB6dEN5OGN3bGxnZVpNUQ?oc=5';
  
  const res = await fetch(url);
  const finalUrl = res.url; // fetch should follow redirect and give us the final URL!
  console.log("Final URL:", finalUrl);

  const html = await res.text();
  const doc = new JSDOM(html, { url: finalUrl });
  const reader = new Readability(doc.window.document);
  const article = reader.parse();
  
  if (article) {
    console.log("Title:", article.title);
    console.log("Text snippet:", article.textContent.substring(0, 200));
  } else {
    console.log("Failed to parse.");
  }
}
test();
