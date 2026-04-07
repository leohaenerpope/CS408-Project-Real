const Database = require('better-sqlite3');

const createPlayersTableSQL = `
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`;

const createMatchupNotesTableSQL = `
  CREATE TABLE IF NOT EXISTS matchup_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    opponent_id INTEGER NOT NULL,
    notes TEXT,
    matchup_date TEXT,
    points INTEGER,
    assists INTEGER,
    rebounds INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (player_id)
      REFERENCES players(id)
      ON DELETE CASCADE,

    FOREIGN KEY (opponent_id)
      REFERENCES players(id)
      ON DELETE CASCADE
  )`; // declares that player/opponent ids must be real things from the players database, if not, delete everything containing them


function createDatabaseManager(dbPath) {
  const database = new Database(dbPath);
  console.log('Database manager created for:', dbPath);
  database.pragma('foreign_keys = ON');
  database.exec(createPlayersTableSQL);
  database.exec(createMatchupNotesTableSQL);

  function ensureConnected() {
    if (!database.open) {
      throw new Error('Database connection is not open');
    }
  }
  const dbHelpers = {
      // clears both players and matchup_notes databases, only used when node process mode is test
      clearDatabase: () => {
        if (process.env.NODE_ENV === 'test') {
          ensureConnected();
          database.prepare('DELETE FROM players').run();
          database.prepare('DELETE FROM matchup_notes').run();
        } else {
          console.warn('clearDatabase called outside of test environment. FIXME!');
        }
      },

      // FOR TESTING PURPOSES. This seeds database with sample data.
      testSeedDatabase: () => {
        if (process.env.NODE_ENV === 'test') {
          ensureConnected();
          const lebron = dbHelpers.createPlayer('LeBron James');
          const curry = dbHelpers.createPlayer('Stephen Curry');

          dbHelpers.createMatchupNote({
            playerId: lebron.id,
            opponentId: curry.id,
            notes: 'Tough defensive matchup',
            matchup_date: '2024-01-01',
            points: 28,
            assists: 8,
            rebounds: 7
          });

          console.log('Database fully seeded using helpers');
        } else {
          console.warn('testSeedDatabase called outside of test environment. FIXME!');
        }
      },

      // Players -----------------------

      getAllPlayers: () => {
        return database.prepare('SELECT * FROM players ORDER BY id DESC').all();
      },

      getPlayerById: (id) => {
        return database.prepare('SELECT * FROM players WHERE id = ?').get(id);
      },

      getPlayerByName: (name) => {
        return database.prepare('SELECT * FROM players WHERE LOWER(name) = LOWER(?)').get(name);
      },

      createPlayer: (name) => {
        if (name.toLowerCase() === 'everyone') {
          throw new Error('You cannot add a player named: everyone')
        }
        const stmt = database.prepare('INSERT INTO players (name) VALUES (?)')
        const info = stmt.run(name);
        return database.prepare('SELECT * FROM players WHERE id = ?').get(info.lastInsertRowid);
      },

      // no update player functionality for project
      // may add layer just for updating name, however not necessary right now

      deletePlayer: (id) => {
        const info = database.prepare('DELETE FROM players WHERE id = ?').run(id);
        return info.changes;
      },

      getTotalPlayers: () => {
        return database.prepare('SELECT COUNT(*) AS c FROM players').get().c;
      },

      // Player Matchup Notes ------------------------------

      getAllPlayerMatchupNotes: (playerId) => {
        const sql = `
        SELECT m.*, p.name AS opponent_name
        FROM matchup_notes m
        JOIN players p ON m.opponent_id = p.id
        WHERE m.player_id = ?
        ORDER BY m.matchup_date DESC
        `;
        return database.prepare(sql).all(playerId);
      },

      createMatchupNote: (note) => {
        const {playerId, opponentId, notes, matchup_date, points, assists, rebounds} = note;
        const sql = `
        INSERT INTO matchup_notes
        (player_id, opponent_id, notes, matchup_date, points, assists, rebounds)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const info = database.prepare(sql).run(
          playerId, opponentId, notes, matchup_date, points, assists, rebounds
        );
        return info.lastInsertRowid;
      },

      updateMatchupNote: (id, note) => {
        const existing = database.prepare('SELECT * FROM matchup_notes WHERE id = ?').get(id);
        if (!existing) return 0;

        const realData = {...existing, ...note}

        const info = database.prepare(
          'UPDATE matchup_notes SET notes = ?, matchup_date = ?, points = ?, assists = ?, rebounds = ? WHERE id = ?'
        ).run(
          realData.notes,
          realData.matchup_date,
          realData.points,
          realData.assists,
          realData.rebounds,
          id);
        return info.changes
      },

      deleteMatchupNote: (id) => {
        const info = database.prepare('DELETE FROM matchup_notes WHERE id = ?').run(id);
        return info.changes;
      },
  };

  // TODO: THIS WILL BE CHANGED FOR CHECKPOINT 3 TO ADD FULL USER ABILITY TO ADD/REMOVE
  // THINGS FROM A DATABASE THAT THEY WILL MAKE THEMSELVES, NOT JUST A SAMPLE DATABASE

  return {
    dbHelpers
  };
}


module.exports = {
  createDatabaseManager,
};
