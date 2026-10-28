import { chromium } from 'playwright';

let browser;
try {
  browser = await chromium.launch({
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
      : { channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : undefined) }),
    chromiumSandbox: true,
    headless: true,
    timeout: 15000,
  });
  const page = await browser.newPage();
  await page.setContent('<html lang="ar" dir="rtl"><h1>اختبار المتصفح</h1></html>');
  const passed = await page.locator('html').getAttribute('dir') === 'rtl'
    && await page.locator('h1').textContent() === 'اختبار المتصفح';
  console.log(JSON.stringify({ browser: browser.version(), directLaunch: passed, chromiumSandbox: true }));
  if (!passed) process.exitCode = 1;
} catch (error) {
  console.error(error.message.split('\n').slice(0, 2).join('\n'));
  process.exitCode = 1;
} finally {
  await browser?.close();
}
