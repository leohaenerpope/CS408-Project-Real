import { test, expect } from '@playwright/test';


// Basic test to see that the Player List page loads as I expect it should
test.describe('Player List Page', () => {
  test('should display player list page', async ({ page }) => {
    await page.goto('/players/');
    await expect(page).toHaveTitle(/NBA Player Matchup Notes - Player List/);
    await expect(page.locator('h2')).toContainText('Player List');
  });
});
