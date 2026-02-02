import { test, expect } from '@playwright/test';

test.describe('Progress page', () => {
  test('shows letter grid for uppercase', async ({ page }) => {
    await page.goto('/progress/upper');
    await expect(page.getByText('Progress')).toBeVisible();

    // Should show stats
    await expect(page.getByText('Mastered')).toBeVisible();
    await expect(page.getByText('New')).toBeVisible();
  });

  test('mode tabs switch content', async ({ page }) => {
    await page.goto('/progress/upper');
    await expect(page.getByText('Progress')).toBeVisible();

    // Click lowercase tab
    await page.getByRole('button', { name: 'abc', exact: true }).click();
    await expect(page).toHaveURL(/\/progress\/lower/);

    // Click both tab
    await page.getByRole('button', { name: 'ABC+abc', exact: true }).click();
    await expect(page).toHaveURL(/\/progress\/both/);
  });

  test('home link navigates back', async ({ page }) => {
    await page.goto('/progress/upper');
    await page.getByText('← Home').click();
    await expect(page).toHaveURL('/');
  });
});
