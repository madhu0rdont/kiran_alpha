import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('shows title and mode buttons', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('ABC Learning')).toBeVisible();
    await expect(page.getByText('Tap to start learning!')).toBeVisible();
  });

  test('shows three mode buttons', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('ABC + abc')).toBeVisible();
    await expect(page.getByText('Uppercase only')).toBeVisible();
    await expect(page.getByText('Lowercase only')).toBeVisible();
  });

  test('uppercase button navigates to session', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Uppercase only').click();
    await expect(page).toHaveURL(/\/session\/upper/);
  });

  test('progress link navigates to progress page', async ({ page }) => {
    await page.goto('/');
    await page.getByText('View Progress').click();
    await expect(page).toHaveURL(/\/progress\/upper/);
  });
});
