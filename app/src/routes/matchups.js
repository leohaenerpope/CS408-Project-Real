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
router.post('/:playerSlug/delete/:matchupId', function(req, res) {
    const { playerSlug, matchupId } = req.params;
    // Logic to remove the note would go here
    res.redirect(`/matchups/${playerSlug}`);
});




// GET add player page
router.get('/:playerSlug/add', (req, res) => {
	const slugFromUrl = req.params.playerSlug;

    // formatted slug for display, may remove this when database retrieval is implemented
    // as the database will store the display name
    const formattedName = slugFromUrl.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    // DATABASE PLAYER MATCHUP NOTES RETRIEVAL HERE TODO

    res.render('matchup-notes-add', { 
        title: `Add Matchup Note for ${formattedName} - NBA Player Matchup Notes`,
        playerSlug: slugFromUrl,
        playerName: formattedName
    });
});
  
// POST for add player page
router.post('/:playerSlug/add', (req, res) => {
	const playerSlug = req.params.playerSlug;

    // DATABASE SAVING HERE TODO
    const { opponent, points, assists, rebounds, notes } = req.body;

    // 2. Redirect back to the dynamic player page
    // This will send them to: http://localhost:3000/matchups/lebron-james
    res.redirect(`/matchups/${playerSlug}`);
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
    const matchupsOppNames = matchups.map(matchup => {
        const opponent = req.db.getPlayerById(matchup.opponentId);
        return {
            ...matchup,
            opponentName: opponent ? opponent.name : 'Unknown Player Name'
        };
    });

    if (dropdownOppId !== 'all') {
        matchupsOppNames = matchupsOppNames.filter(
            m => String(m.opponentId) === String(dropdownOppId)
        );
    }

    // for opponents select dropdown in EJS page
    const opponents = [];
    const seen = new Set();
    matchups.forEach(m => {
        if (!seen.has(m.opponentId)) {
            const opponent = req.db.getPlayerById(m.opponentId);
            if (opponent) {
                opponents.push(opponent);
                seen.add(m.opponentId);
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