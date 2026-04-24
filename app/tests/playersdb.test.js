import { test, expect } from '@playwright/test';
import { createDatabaseManager } from '../src/bin/db';
import path from 'path';

const testDbPath = path.join(__dirname, '../test-data/test-database.sqlite');

// Simple database tests using the testSeedDatabase function from db.js
test.describe('Players Database Tests', () => {
    let dbManager;

    // Before each test, intialize databse manager, clear and seed test data
    test.beforeEach(() => {
        // Create the test database
        dbManager = createDatabaseManager(testDbPath).dbHelpers;

        // clear and seed database
        dbManager.clearDatabase();
        dbManager.testSeedDatabase();
    })

    // database contains players
    test('testSeedDatabase functionality: adding correct players', async () => {
        const players = dbManager.getAllPlayers();
    
        const playerNames = players.map(p => p.name);
        expect(playerNames).toContain('LeBron James');
        expect(playerNames).toContain('Stephen Curry');
    
        console.log('All seeded players:', playerNames);
    });

    // clearDatabase functionality
    test('clearDatabase functionality: empties the database', async () => {
        dbManager.clearDatabase();
        const players = dbManager.getAllPlayers();
        expect(players.length).toBe(0);
    });

     // basic delete functionality
     test('delete player functionality: player removed from players DB', async () => {
        const playersBefore = dbManager.getAllPlayers();
        const player1 = playersBefore[0];
        dbManager.deletePlayer(player1.id);

        const playersAfter = dbManager.getAllPlayers();
        // first players
        expect(playersAfter.length).toBe(playersBefore.length - 1);
    });

    // deleting a player should remove player and all matchup notes associated with them
    test('delete player functionality: deletes players and matchup notes', async () => {
        const playersBefore = dbManager.getAllPlayers();
        const player1 = playersBefore[0];
        const player1MatchupsBefore = dbManager.getAllPlayerMatchupNotes(player1.id);
        dbManager.deletePlayer(player1.id);

        const playersAfter = dbManager.getAllPlayers();
        const player1MatchupsAfter = dbManager.getAllPlayerMatchupNotes(player1.id);
        // first players
        expect(playersAfter.length).toBe(playersBefore.length - 1);

        // matchup notes should be empty
        expect(player1MatchupsAfter).toEqual([]);
    });

    // testing that update matchup notes correctly edits the fields of an already existing matchup note
    test('updateMatchupNote: updates all fields correctly', async () => {
        const lebron = dbManager.getPlayerByName("LeBron James");
        const matchups = dbManager.getAllPlayerMatchupNotes(lebron.id);
        const matchup = matchups[0];

        dbManager.updateMatchupNote(matchup.id, {
            notes: 'a',
            matchup_date: '2025-05-05',
            points: 5,
            assists: 4,
            rebounds: 3
        });

        const updated = dbManager.getMatchupNoteById(matchup.id);

        expect(updated.notes).toBe('a');
        expect(updated.matchup_date).toBe('2025-05-05');
        expect(updated.points).toBe(5);
        expect(updated.assists).toBe(4);
        expect(updated.rebounds).toBe(3);
    });

    // makes sure that updating one matchup note doesn't affect a different one that should not be changed
    test('updateMatchupNote: does not modify other matchup notes', async () => {
        const lebron = dbManager.getPlayerByName("LeBron James");
        const curry = dbManager.getPlayerByName("Stephen Curry");

        // create second note
        const secondId = dbManager.createMatchupNote({
            playerId: lebron.id,
            opponentId: curry.id,
            notes: 'note2',
            matchup_date: '2023-01-01',
            points: 1,
            assists: 2,
            rebounds: 3
        });

        const matchups = dbManager.getAllPlayerMatchupNotes(lebron.id);
        const first = matchups.find(m => m.id !== secondId);

        dbManager.updateMatchupNote(first.id, {
            notes: 'Only first updated',
            matchup_date: '2022-02-02',
            points: 99,
            assists: 99,
            rebounds: 99
        });

        const unchanged = dbManager.getMatchupNoteById(secondId);

        expect(unchanged.notes).toBe('note2');
        expect(unchanged.points).toBe(1);
    });

  });
  