import { test, expect } from '@playwright/test';


// Basic test to see that the Player Add page loads as I expect it should
test.describe('Player List Page', () => {
  test('should display player add page', async ({ page }) => {
    await page.goto('/players/add');
    await expect(page).toHaveTitle(/NBA Player Matchup Notes - Add New Player/);
    await expect(page.locator('label')).toContainText('Player Name');
  });
});
