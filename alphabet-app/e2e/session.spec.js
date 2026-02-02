import { test, expect } from '@playwright/test';

test.describe('Session flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate through profile picker to start a session
    await page.goto('/');
    await page.getByText('Kiran').click();
    await page.getByText('Uppercase only').click();
    await expect(page.getByText(/Card \d+ of \d+/)).toBeVisible({ timeout: 10000 });
  });

  test('shows a card with grade buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: '✓' })).toBeVisible();
    await expect(page.getByRole('button', { name: '✗' })).toBeVisible();
  });

  test('correct answer advances the card', async ({ page }) => {
    const counter = page.getByText(/Card \d+ of \d+/);
    const text1 = await counter.textContent();

    await page.getByRole('button', { name: '✓' }).click();

    await expect(async () => {
      const text2 = await counter.textContent().catch(() => '');
      const completed = await page.getByText('Great Job!').isVisible().catch(() => false);
      expect(text2 !== text1 || completed).toBeTruthy();
    }).toPass({ timeout: 5000 });
  });

  test('wrong answer advances the card', async ({ page }) => {
    const counter = page.getByText(/Card \d+ of \d+/);
    const text1 = await counter.textContent();

    await page.getByRole('button', { name: '✗' }).click();

    await expect(async () => {
      const text2 = await counter.textContent().catch(() => '');
      const completed = await page.getByText('Great Job!').isVisible().catch(() => false);
      expect(text2 !== text1 || completed).toBeTruthy();
    }).toPass({ timeout: 5000 });
  });

  test('completing all cards shows celebration screen', async ({ page }) => {
    test.setTimeout(60000);

    for (let i = 0; i < 30; i++) {
      if (await page.getByText('Great Job!').isVisible().catch(() => false)) break;

      const correct = page.getByRole('button', { name: '✓' });
      await expect(correct).toBeEnabled({ timeout: 5000 }).catch(() => {});
      if (await page.getByText('Great Job!').isVisible().catch(() => false)) break;

      await correct.click();
      await page.waitForTimeout(300);
    }

    await expect(page.getByText('Great Job!')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Play Again')).toBeVisible();
    await expect(page.getByText('Go Home')).toBeVisible();
  });

  test('Go Home button navigates back to mode selection', async ({ page }) => {
    test.setTimeout(60000);

    for (let i = 0; i < 30; i++) {
      if (await page.getByText('Great Job!').isVisible().catch(() => false)) break;

      const correct = page.getByRole('button', { name: '✓' });
      await expect(correct).toBeEnabled({ timeout: 5000 }).catch(() => {});
      if (await page.getByText('Great Job!').isVisible().catch(() => false)) break;

      await correct.click();
      await page.waitForTimeout(300);
    }

    await expect(page.getByText('Great Job!')).toBeVisible({ timeout: 10000 });
    await page.getByText('Go Home').click();
    await expect(page.getByText('Tap to start learning!')).toBeVisible();
  });
});
