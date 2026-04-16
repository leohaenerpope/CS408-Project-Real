import { test, expect } from '@playwright/test';
import { createDatabaseManager } from '../src/bin/db';
import path from 'path';

const testDbPath = path.join(__dirname, '../test-data/test-database.sqlite');

// Simple database tests using the testSeedDatabase function from db.js
test.describe('Matchups Database Tests', () => {
    let dbManager;

    // Before each test add in the test seed data
    test.beforeEach(() => {
        // Create the test database
        dbManager = createDatabaseManager(testDbPath).dbHelpers;

        // clear and seed database
        dbManager.clearDatabase();
        dbManager.testSeedDatabase();
    })

    // Database contains correct matchup notes for player Lebron.
    // Warning: testSeedDatabase should add a matchup note for Lebron James
    test('getAllPlayerMatchupNotes functionality: retrieving correct matchup notes', async () => {
        const lebron = dbManager.getPlayerByName("LeBron James");
        const matchups = dbManager.getAllPlayerMatchupNotes(lebron.id);
    
        expect(matchups.length).toBeGreaterThan(0);
    });

    // Makes sure that matchup notes has 1, then deletes, then makes sure there are no matchup notes.
    test('deleteMatchupNote functionality: correctly deletes from database', async () => {
        const lebron = dbManager.getPlayerByName("LeBron James");
        let matchups = dbManager.getAllPlayerMatchupNotes(lebron.id);
        expect(matchups.length).toBeGreaterThan(0);
        
        dbManager.deleteMatchupNote(matchups[0].id);
        matchups = dbManager.getAllPlayerMatchupNotes(lebron.id);
    
        expect(matchups.length).toBe(0);
    });

    // Adds new matchup note for Lebron, checks if Lebron's matchup notes are greater than before
    test('addMatchupNote functionality: correctly adds to specific player', async () => {
        const lebron = dbManager.getPlayerByName("LeBron James");
        const curry = dbManager.getPlayerByName("LeBron James");
        const oldMatchups = dbManager.getAllPlayerMatchupNotes(lebron.id);

        const matchupId = dbManager.createMatchupNote({
            playerId: lebron.id,
            opponentId: curry.id,
            notes: 'Not too shabby',
            matchup_date: '2020-02-02',
            points: 30,
            assists: 8,
            rebounds: 7
        });

        const matchups = dbManager.getAllPlayerMatchupNotes(lebron.id);
        expect(matchups.length).toBeGreaterThan(oldMatchups.length);
    });
  });
  