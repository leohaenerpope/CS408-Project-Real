var express = require('express');
var router = express.Router();

// GET for showing the Edit Form
router.get('/:playerId/edit/:matchupId', function(req, res) {
    const { playerId, matchupId } = req.params;

    const sqlNote = req.db.getMatchupNoteById(matchupId);

    const playerName = req.db.getPlayerById(playerId).name;
    const opponentName = req.db.getPlayerById(sqlNote.opponent_id).name;

    const rawDate = sqlNote.matchup_date;
    let formattedDate = '';
    if (rawDate) {
        const d = new Date(rawDate);
        formattedDate = d.toISOString().split('T')[0];
    }


    const existingNote = {
        id: sqlNote.id,
        matchupDate: formattedDate,
        opponent: opponentName,
        points: sqlNote.points,
        assists: sqlNote.assists,
        rebounds: sqlNote.rebounds,
        notes: sqlNote.notes
    };

    res.render('matchup-notes-edit', {
        title: 'Edit Matchup Note - NBA Player Matchup Notes',
        playerId: playerId,
        note: existingNote,
        playerName: playerName
    });
});

// POST save Changes to matchup note
router.post('/:playerId/edit/:matchupId', function(req, res) {
    const playerId = req.params.playerId;
    const matchupId = req.params.matchupId;
    const { matchupDate, points, assists, rebounds, notes } = req.body; 
    const editMatchupData = {
        matchup_date: matchupDate, //matchup dates sql variable matches
        points, assists, rebounds, notes
    };
    req.db.updateMatchupNote(matchupId, editMatchupData);

    res.redirect(`/matchups/${playerId}`);
});

// POST delete Note
router.post('/:playerId/delete/:matchupId', function(req, res) {
    const { playerId, matchupId } = req.params;
    req.db.deleteMatchupNote(matchupId);
    res.redirect(`/matchups/${playerId}`);
});




// GET add player page
router.get('/:playerId/add', (req, res) => {
	const playerId = req.params.playerId;

    const player = req.db.getPlayerById(playerId);
    const playerName = player.name;

    // DATABASE PLAYER MATCHUP NOTES RETRIEVAL HERE TODO

    res.render('matchup-notes-add', { 
        title: `Add Matchup Note for ${playerName} - NBA Player Matchup Notes`,
        playerId: playerId,
        playerName: playerName
    });
});
  
// POST for add player page
router.post('/:playerId/add', (req, res) => {
    const playerId = req.params.playerId;
    const playerName = req.db.getPlayerById(playerId).name

    const { opponent, matchupDate, points, assists, rebounds, notes } = req.body;

    const opponentDb = req.db.getPlayerByName(opponent);

    // Make sure that opponent is recognized in database
    if (!opponentDb) {
        return res.render('matchup-notes-add', { 
            title: `Add Matchup Note for ${playerName} - NBA Player Matchup Notes`,
            playerId: playerId,
            playerName: playerName,
            error: "Failed to add matchup note: opponent name not recognized."
        });
    }
    const opponentId = opponentDb.id;

    // Check if opponent isn't same as player
    // Check as strings because playerId is String and ooponentId is int
    if (String(opponentId) === String(playerId)) {
        return res.render('matchup-notes-add', { 
            title: `Add Matchup Note for ${playerName} - NBA Player Matchup Notes`,
            playerId: playerId,
            playerName: playerName,
            error: "Failed to add matchup note: Player and opponent cannot be the same person!"
        });
    }

    req.db.createMatchupNote({playerId, opponentId, notes, matchup_date: matchupDate, points, assists, rebounds})
    res.redirect(`/matchups/${playerId}`);
});


// GET player matchup notes list page
router.get('/:playerId', function(req, res, next) {
    const playerId = req.params.playerId;
    const dropdownOppId = req.query.opponent || 'all';
    const player = req.db.getPlayerById(playerId);
    const playerName = player.name;
    const matchups = req.db.getAllPlayerMatchupNotes(playerId);

    // since matchups only stores opponent ids, get all the opponent actual names
    // this may be a design problem with the database itself, but it's fine for now
    let matchupsOppNames = matchups.map(matchup => {
        return {
            ...matchup,
            opponentName: matchup.opponent_name,
            formattedDate: matchup.matchup_date ? matchup.matchup_date .toString().split('T')[0] : ''   
        };
    });

    if (dropdownOppId !== 'all') {
        matchupsOppNames = matchupsOppNames.filter(
            m => String(m.opponent_id) === String(dropdownOppId)
        );
    }

    // for opponents select dropdown in EJS page
    const opponents = [];
    const seen = new Set();
    matchups.forEach(m => {
        if (!seen.has(m.opponent_id)) {
            const opponent = req.db.getPlayerById(m.opponent_id);
            if (opponent) {
                opponents.push(opponent);
                seen.add(m.opponent_id);
            }
        }
    });
    

    res.render('matchup-notes-player', { 
        title: `${playerName} Matchup Notes - NBA Player Matchup Notes`,
        matchups: matchupsOppNames,
        playerName: playerName,
        playerId: playerId,
        opponents,
        dropdownOppId
    });
});


module.exports = router;