const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  await page.goto('https://sentinel-4b8v5lb81-aniruddha-fittrack.vercel.app', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
})();
