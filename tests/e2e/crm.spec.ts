import { expect, test } from '@playwright/test';

test('RTL modules fit the viewport and demo makes no Supabase request', async ({ page }) => {
  const external: string[] = [];
  page.on('request', r => { if (r.url().includes('supabase.co')) external.push(r.url()); });
  const modules = [
    ['', 'كل متابعة تصنع فرقاً.'], ['patients', 'المراجعون'], ['dispense', 'صرف العلاج'],
    ['allergies', 'صندوق تنبيهات الحساسية'], ['consultations', 'الاستشارات'],
    ['followups', 'المتابعات اليومية'], ['analytics', 'الإحصائيات والرؤى'],
    ['medications', 'دليل الأدوية'], ['labs', 'المراقبة المختبرية'],
    ['documents', 'مستندات المراجعين'], ['settings', 'الإعدادات والفريق'],
  ];
  for (const [path, title] of modules) {
    await page.goto('/demo/' + path);
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  }
  expect(external).toEqual([]);
});

test('patient editing, medication editing, dispensing and refill history persist', async ({ page }) => {
  const patientName = 'Synthetic E2E Patient';
  await page.goto('/demo/patients');
  await page.getByRole('button', { name: 'Switch language' }).click();
  await page.getByRole('button', { name: 'Add patient', exact: true }).click();
  await page.getByLabel('Full name *', { exact: true }).fill(patientName);
  await page.getByLabel('Iraqi phone *', { exact: true }).fill('07709997777');
  await page.getByRole('button', { name: 'Save patient', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('link', { name: new RegExp(patientName) }).click();
  // Wait for the destination before a global badge assertion can see list rows.
  await expect(page.getByRole('heading', { name: patientName, level: 1, exact: true })).toBeVisible();
  const patientUrl = page.url();
  await expect(page.getByText('Allergy history unknown', { exact: true })).toBeVisible();
  await expect(page.getByTestId('refill-timeline')).not.toHaveAttribute('open');

  await page.getByRole('button', { name: 'Edit record', exact: true }).click();
  await page.getByLabel('Address', { exact: true }).fill('Synthetic edited address');
  await page.getByRole('button', { name: 'Save patient', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Edit record', exact: true }).click();
  await expect(page.getByLabel('Address', { exact: true })).toHaveValue('Synthetic edited address');
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();

  await page.getByRole('button', { name: 'Add Medication', exact: true }).click();
  const editor = page.getByTestId('medication-form');
  const medicationSelect = editor.getByRole('combobox', { name: /Medication — type to search/ });
  await expect(medicationSelect).toBeFocused();
  expect(await editor.evaluate(el => !!(el.compareDocumentPosition(document.querySelector('[data-testid="medication-list"]')!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  await medicationSelect.selectOption({ label: 'ميتفورمين · Metformin 500 mg' });
  await page.getByRole('button', { name: 'Use suggestion', exact: true }).click();
  await expect(editor.getByLabel('Days supply (pharmacist verified)', { exact: true })).toHaveValue('30');
  await page.getByRole('button', { name: 'Save medication', exact: true }).click();
  await expect(editor).toHaveCount(0);
  await page.getByTestId('medication-list').getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Prescription instructions', { exact: true }).fill('Synthetic prescription verification only');
  await page.getByRole('button', { name: 'Save medication', exact: true }).click();
  await expect(editor).toHaveCount(0);
  await page.getByRole('button', { name: 'Dispense', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dispense medication', exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Medication on recorded prescription *', exact: true }).selectOption({ label: 'ميتفورمين 500 mg' });
  await expect(page.getByText(/Synthetic prescription verification only/)).toBeVisible();
  const dispensingDate = await page.getByLabel('Dispensing date *', { exact: true }).inputValue();
  const expectedDate = new Date(dispensingDate + 'T00:00:00Z');
  expectedDate.setUTCDate(expectedDate.getUTCDate() + 30);
  const expectedRefill = expectedDate.toISOString().slice(0, 10);
  await expect(page.getByText(/^Expected refill:/)).toContainText(expectedRefill);
  const confirm = page.getByRole('button', { name: 'Confirm and record dispensing', exact: true });
  await expect(confirm).toBeDisabled();
  await page.getByRole('checkbox', { name: 'I reviewed the allergy history, warnings and source with the patient', exact: true }).check();
  await page.getByRole('checkbox', { name: 'I verified the prescription, medication, quantity and supply', exact: true }).check();
  await confirm.click();
  await expect(page.getByRole('combobox', { name: 'Medication on recorded prescription *', exact: true })).toHaveValue('');
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Dispensed today 1 documented transactions', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'صرف اليوم 1 عملية صرف موثقة', exact: true })).toBeVisible();
  await page.goto(patientUrl);
  const timeline = page.getByTestId('refill-timeline');
  await expect(timeline).not.toHaveAttribute('open');
  await timeline.locator('summary').click();
  await expect(timeline.getByText(expectedRefill, { exact: true })).toBeVisible();
  await expect(timeline.getByText(dispensingDate, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Switch language' }).click();
  await page.getByRole('button', { name: 'Archive', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Restore', exact: true })).toBeVisible();
  await expect(timeline.getByText(expectedRefill, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Restore', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Archive', exact: true })).toBeVisible();
});

test('inbox resolution retains allergy and role simulation blocks clinical writing', async ({ page }) => {
  await page.goto('/demo/allergies');
  await page.getByRole('button', { name: 'Switch language' }).click();
  await page.getByRole('button', { name: 'Review & history', exact: true }).first().click();
  const review = page.getByRole('dialog', { name: 'Allergy alert review', exact: true });
  await expect(review).toBeVisible();
  await review.getByRole('combobox', { name: 'Review status', exact: true }).selectOption('resolved');
  await review.getByLabel('Verification source, notes and decision', { exact: true }).fill('Synthetic source verification complete');
  await review.getByRole('button', { name: 'Save documented review', exact: true }).click();
  await expect(review).toHaveCount(0);
  await page.getByRole('button', { name: 'Resolved', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Review & history', exact: true })).toHaveCount(1);
  await expect(page.getByText('أموكسيسيلين', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'أحمد كريم', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'أحمد كريم', level: 1, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Allergies', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'أموكسيسيلين Critical', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Settings & team', exact: true }).click();
  await page.getByRole('combobox', { name: 'Demo role simulation only', exact: true }).selectOption('staff');
  await page.getByRole('link', { name: 'Patients', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Add patient', exact: true })).toBeDisabled();
});

test('critical ingredient match blocks pharmacist dispensing even with a reason', async ({ page }) => {
  await page.goto('/demo/settings');
  await page.getByRole('button', { name: 'Switch language' }).click();
  await page.getByRole('combobox', { name: 'Demo role simulation only', exact: true }).selectOption('pharmacist');
  await page.getByRole('link', { name: 'Patients', exact: true }).click();
  await page.getByRole('link', { name: /أحمد كريم/ }).click();
  await expect(page.getByRole('heading', { name: 'أحمد كريم', level: 1, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Add Medication', exact: true }).click();
  await page.getByRole('combobox', { name: /Medication — type to search/ }).selectOption({ label: 'أموكسيسيلين · Amoxicillin 500 mg' });
  await page.getByRole('button', { name: 'Use suggestion', exact: true }).click();
  await page.getByRole('button', { name: 'Save medication', exact: true }).click();
  await expect(page.getByTestId('medication-form')).toHaveCount(0);
  await page.getByRole('button', { name: 'Dispense', exact: true }).click();
  await page.getByRole('combobox', { name: 'Medication on recorded prescription *', exact: true }).selectOption({ label: 'أموكسيسيلين 500 mg' });
  await expect(page.getByRole('heading', { name: 'Routine dispensing blocked', exact: true })).toBeVisible();
  await page.getByRole('checkbox', { name: 'I reviewed the allergy history, warnings and source with the patient', exact: true }).check();
  await page.getByRole('checkbox', { name: 'I verified the prescription, medication, quantity and supply', exact: true }).check();
  await page.getByLabel('Clinical decision / supply basis (at least 15 characters)', { exact: true }).fill('Synthetic reason cannot authorize a pharmacist override');
  await expect(page.getByRole('button', { name: 'Confirm and record dispensing', exact: true })).toBeDisabled();
});
