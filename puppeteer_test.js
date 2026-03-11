const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  // Goto local server
  await page.goto('http://localhost:8080/generated-page.html', { waitUntil: 'networkidle0' });
  
  // Also check if the canvas is rendered
  const canvasExists = await page.evaluate(() => {
    return !!document.querySelector('#dragon-canvas-container canvas');
  });

  const canvasWidth = await page.evaluate(() => {
    const el = document.querySelector('#dragon-canvas-container');
    return el ? el.clientWidth : 0;
  });

  const canvasHeight = await page.evaluate(() => {
    const el = document.querySelector('#dragon-canvas-container');
    return el ? el.clientHeight : 0;
  });

  console.log('Canvas exists:', canvasExists);
  console.log('Container Width:', canvasWidth);
  console.log('Container Height:', canvasHeight);

  // Take a screenshot to inspect later manually
  await page.screenshot({ path: 'test_screenshot.png' });

  await browser.close();
})();
