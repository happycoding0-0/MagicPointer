const fs = require('fs');
const html = fs.readFileSync('google_news_redirect.html', 'utf8');

// Find all URLs inside data-n-au
const dataMatches = html.match(/data-n-au="([^"]+)"/g);
if (dataMatches) {
  console.log("Data URLs:", dataMatches.slice(0, 3));
} else {
  console.log("No data-n-au found");
}

// Find window.location
const locMatches = html.match(/window\.location\.replace\(['"]([^'"]+)['"]\)/g);
if (locMatches) {
  console.log("Location matches:", locMatches.slice(0, 3));
} else {
  console.log("No window.location found");
}

// Find any meta refresh
const metaMatches = html.match(/<meta[^>]*refresh[^>]*>/gi);
if (metaMatches) {
  console.log("Meta refresh:", metaMatches);
}

// Find c-wiz data URLs
const cwizMatches = html.match(/<c-wiz[^>]*data-url="([^"]+)"/gi);
if (cwizMatches) {
  console.log("cwiz URL:", cwizMatches.slice(0, 3));
}

// Just match any url that looks like a real news article in the HTML
const anyUrl = html.match(/"(https:\/\/[^"]+)"/g);
if (anyUrl) {
  console.log("Random URLs:", anyUrl.slice(0, 10));
}
