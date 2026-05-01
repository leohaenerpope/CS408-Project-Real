import { test, expect } from '@playwright/test';
import { createDatabaseManager } from '../../src/bin/db';
import path from 'path';

const testDbPath = path.join(__dirname, '../../test-data/test-database.sqlite');

// Tests for player matchup list page. These rely on the database to be correctly functioning as of now.
test.describe('Player Matchup List Page', () => {
    let dbManager;

    // Before each test, intialize databse manager, clear and seed test data
    test.beforeEach(async () => {
        // Create the test database
        dbManager = createDatabaseManager(testDbPath).dbHelpers;

        // clear and seed database
        dbManager.clearDatabase();
        dbManager.testSeedDatabase();
    })

    // should have correct title and header
    test('should display player list page', async ({ page }) => {
        const player1 = dbManager.getPlayerByName('Lebron James');

        await page.goto(`/matchups/${player1.id}`);
        await expect(page).toHaveTitle(new RegExp(`${player1.name} Matchup Notes - NBA Player Matchup Notes`));
        await expect(page.locator('h2')).toContainText('Matchup Notes For:');
    });
});
