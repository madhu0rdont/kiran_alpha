import { test, expect } from '@playwright/test';

test.describe('Admin page', () => {
  test('shows letter cards', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByText('Letter Images')).toBeVisible();

    // Should show all 26 letters
    for (const letter of ['A', 'B', 'C', 'X', 'Y', 'Z']) {
      await expect(page.getByText(letter, { exact: true }).first()).toBeVisible();
    }
  });

  test('home link navigates back', async ({ page }) => {
    await page.goto('/admin');
    await page.getByText('← Home').click();
    await expect(page).toHaveURL('/');
  });

  test('can edit a letter word', async ({ page }) => {
    await page.goto('/admin');

    // Find the first pencil icon and click it
    const pencilButton = page.getByText('✎').first();
    await pencilButton.click();

    // Should show an input field
    const input = page.locator('input').first();
    await expect(input).toBeVisible();

    // Type a new word
    await input.fill('TestWord');
    await input.press('Enter');

    // Reload and verify persistence
    await page.reload();
    await expect(page.getByText('TestWord')).toBeVisible();
  });
});
