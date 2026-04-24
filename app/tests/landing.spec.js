import { test, expect } from '@playwright/test';


// Basic test to see that the landing page loads as I expect it should
test.describe('Landing Page', () => {
  test('should display landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/NBA Player Matchup Notes/);
    await expect(page.locator('p.lead')).toContainText('Create matchup notes to learn about how your favorite NBA players perform against others.');
  });
});
