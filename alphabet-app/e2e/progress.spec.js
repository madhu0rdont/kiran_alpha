import { test, expect } from '@playwright/test';

test.describe('Progress page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByText('Kiran').click();
    await page.getByText('View Progress').click();
  });

  test('shows letter grid for uppercase', async ({ page }) => {
    await expect(page.getByText('Progress')).toBeVisible();
    await expect(page.getByText('Mastered')).toBeVisible();
    await expect(page.getByText('New')).toBeVisible();
  });

  test('mode tabs switch content', async ({ page }) => {
    await expect(page.getByText('Progress')).toBeVisible();

    await page.getByRole('button', { name: 'abc', exact: true }).click();
    await expect(page).toHaveURL(/\/progress\/lower/);

    await page.getByRole('button', { name: 'ABC+abc', exact: true }).click();
    await expect(page).toHaveURL(/\/progress\/both/);
  });

  test('home link navigates back', async ({ page }) => {
    await page.getByText('← Home').click();
    await expect(page.getByText('Tap to start learning!')).toBeVisible();
  });
});
