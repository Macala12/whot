const mongoose = require('mongoose');
const Leaderboard = require("../models/Leaderboard");

const fetchPlayers = async (tournamentId) => {
    const fetchedPlayers = await Leaderboard.find({ leaderboardId: tournamentId });
    if (!fetchedPlayers) {
        console.error(error);
    }
    return fetchedPlayers;
}

module.exports = { fetchPlayers };