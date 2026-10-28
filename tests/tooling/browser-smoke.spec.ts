import { expect, test } from '@playwright/test';

test('one worker can launch Chromium and render Arabic RTL', async ({ page }) => {
  await page.setContent('<html lang="ar" dir="rtl"><h1>اختبار المتصفح</h1></html>');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('heading')).toHaveText('اختبار المتصفح');
});
