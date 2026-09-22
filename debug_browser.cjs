const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  page.on('response', response => {
    if (!response.ok()) {
      console.log('BROWSER NETWORK ERROR:', response.status(), response.url());
    }
  });

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    console.log('Page loaded.');
    // Let's also check if there is an element with id="root" and its innerHTML
    const rootHtml = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.innerHTML.slice(0, 500) : 'NO ROOT ELEMENT';
    });
    console.log('Root HTML length:', rootHtml.length);
    console.log('Root HTML snippet:', rootHtml);
  } catch (err) {
    console.error('Failed to load page:', err);
  }
  
  await browser.close();
})();
