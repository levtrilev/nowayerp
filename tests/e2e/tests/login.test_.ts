import { test, expect } from '@playwright/test';

test.describe('Login page', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('body > main > div > form > div > h1')).toContainText('Please log in to continue');
  });

  test('should login successfully', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'user2@ya.ru');
    await page.fill('input[name="password"]', '123456');
    // await page.click('button[type="submit"]');
    await page.getByRole('button', { name: 'Log in' }).click();
    
    await expect(page).toHaveURL('/login');
  });
});