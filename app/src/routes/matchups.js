var express = require('express');
var router = express.Router();

// GET for showing the Edit Form
router.get('/:playerSlug/edit/:matchupId', function(req, res) {
    const { playerSlug, matchupId } = req.params;

    // STUB
    const existingNote = {
        id: matchupId,
        matchupDate: '2026-03-10',
        opponent: 'Stephen Curry',
        points: 28,
        assists: 8,
        rebounds: 4,
        notes: 'Curry is too small and no match for lebron'
    };

    res.render('matchup-notes-edit', {
        title: 'Edit Matchup Note - NBA Player Matchup Notes',
        playerSlug: playerSlug,
        note: existingNote
    });
});

// POST save Changes
router.post('/:playerSlug/edit/:matchupId', function(req, res) {
    const { playerSlug, matchupId } = req.params;
    // Logic to update the database would go here
    res.redirect(`/matchups/${playerSlug}`);
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

    // DATABASE SAVING HERE TODO
    const { opponent, matchupDate, points, assists, rebounds, notes } = req.body;

    const opponentDb = req.db.getPlayerByName(opponent);

    if (!opponentDb) {
        // return error, maybe like in the add player thing
        return res.send('Opponent not found in database');
    }
    const opponentId = opponentDb.id;

    req.db.createMatchupNote({playerId, opponentId, notes, matchup_date: matchupDate, points, assists, rebounds})
    // 2. Redirect back to the dynamic player page
    // This will send them to: http://localhost:3000/matchups/lebron-james
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