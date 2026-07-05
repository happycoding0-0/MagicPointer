const test = async () => {
  const rssUrl = 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=01&plink=RSSREADER';
  const response = await fetch(rssUrl);
  const xml = await response.text();

  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null && items.length < 20) {
    const itemXml = match[1];
    
    // SBS XML has CDATA for titles maybe?
    const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
    const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
    
    if (titleMatch && linkMatch) {
      items.push({
        title: titleMatch[1],
        link: linkMatch[1]
      });
    }
  }
  
  console.log("Found items:", items.length);
  if (items.length > 0) {
    console.log("First item:", items[0]);
  } else {
    // Let's print the first <item> to see what it looks like
    const firstItem = xml.match(/<item>([\s\S]*?)<\/item>/);
    console.log("First item XML:", firstItem ? firstItem[1] : "No <item> found");
  }
}
test();
