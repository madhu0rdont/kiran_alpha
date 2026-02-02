import { test, expect } from '@playwright/test';

test.describe('Session flow', () => {
  test('starts an uppercase session and shows a card', async ({ page }) => {
    await page.goto('/session/upper');

    // Wait for cards to load
    await expect(page.getByText(/Card \d+ of \d+/)).toBeVisible({ timeout: 10000 });

    // Should show a grade button
    await expect(page.getByRole('button', { name: '✓' })).toBeVisible();
    await expect(page.getByRole('button', { name: '✗' })).toBeVisible();
  });

  test('correct answer advances the card', async ({ page }) => {
    await page.goto('/session/upper');
    await expect(page.getByText(/Card \d+ of \d+/)).toBeVisible({ timeout: 10000 });

    // Note the current card counter
    const counter = page.getByText(/Card \d+ of \d+/);
    const text1 = await counter.textContent();

    // Click correct
    await page.getByRole('button', { name: '✓' }).click();

    // Counter should advance (or session completes)
    await expect(async () => {
      const text2 = await counter.textContent().catch(() => '');
      const completed = await page.getByText('Great Job!').isVisible().catch(() => false);
      expect(text2 !== text1 || completed).toBeTruthy();
    }).toPass({ timeout: 5000 });
  });

  test('wrong answer advances the card', async ({ page }) => {
    await page.goto('/session/upper');
    await expect(page.getByText(/Card \d+ of \d+/)).toBeVisible({ timeout: 10000 });

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
    await page.goto('/session/upper');
    await expect(page.getByText(/Card \d+ of \d+/)).toBeVisible({ timeout: 10000 });

    // Grade all cards correct to finish quickly
    for (let i = 0; i < 30; i++) {
      if (await page.getByText('Great Job!').isVisible().catch(() => false)) break;

      // Wait for button to be enabled
      const correct = page.getByRole('button', { name: '✓' });
      await expect(correct).toBeEnabled({ timeout: 5000 }).catch(() => {});
      if (await page.getByText('Great Job!').isVisible().catch(() => false)) break;

      await correct.click();
      await page.waitForTimeout(300);
    }

    // Should reach completion screen
    await expect(page.getByText('Great Job!')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Play Again')).toBeVisible();
    await expect(page.getByText('Go Home')).toBeVisible();
  });

  test('Go Home button navigates back', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/session/upper');
    await expect(page.getByText(/Card \d+ of \d+/)).toBeVisible({ timeout: 10000 });

    // Complete all cards
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
    await expect(page).toHaveURL('/');
  });
});
