import { test, expect } from '@playwright/test';

test.describe('Profile select and Home page', () => {
  test('shows profile picker on root', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('ABC Learning')).toBeVisible();
    await expect(page.getByText("Who's learning today?")).toBeVisible();
    await expect(page.getByText('Kiran')).toBeVisible();
  });

  test('can add a new child profile', async ({ page }) => {
    await page.goto('/');
    await page.getByText('+ Add Child').click();
    await page.getByPlaceholder("Child's name").fill('TestKid');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByText('TestKid')).toBeVisible();
  });

  test('selecting a profile shows mode buttons', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Kiran').click();
    await expect(page.getByText('Tap to start learning!')).toBeVisible();
    await expect(page.getByText('ABC + abc')).toBeVisible();
    await expect(page.getByText('Uppercase only')).toBeVisible();
    await expect(page.getByText('Lowercase only')).toBeVisible();
  });

  test('uppercase button navigates to session', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Kiran').click();
    await page.getByText('Uppercase only').click();
    await expect(page).toHaveURL(/\/child\/\d+\/session\/upper/);
  });

  test('progress link navigates to progress page', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Kiran').click();
    await page.getByText('View Progress').click();
    await expect(page).toHaveURL(/\/child\/\d+\/progress\/upper/);
  });

  test('switch child link goes back to profile picker', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Kiran').click();
    await page.getByText('Switch Child').click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText("Who's learning today?")).toBeVisible();
  });
});
