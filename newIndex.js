const initializeDeck = require("./utils/functions/initializeDeck");
const reverseState = require("./utils/functions/reverseState");
const players = require("./controller/dummyData");

const mongoose = require("mongoose");
const express = require("express");
const Leaderboard = require("./models/Leaderboard");
const { fetchPlayers } = require("./controller/fetch_players");

const app = express();
app.use(express.json());

// 🔹 Tournament store
let tournaments = {};
function getTournament(tournamentId) {
  if (!tournaments[tournamentId]) {
    tournaments[tournamentId] = {
      rooms: [],
      winners: [],
      roundCount: 0,
    };
  }
  return tournaments[tournamentId];
}

// DB connect
let playersDbs;
mongoose
  .connect("mongodb+srv://michael-user-1:Modubass1212@assetron.tdmvued.mongodb.net/octagames")
  .then(() => {
    console.log("MongoDB Connected");
    return fetchPlayers("68a64d526223e4d5e74daaea"); // ⚠️ still hardcoded, you’ll replace later
  })
  .then((playersDb) => {
    playersDbs = playersDb;
    const round = createRound(playersDb, "68a64d526223e4d5e74daaea");
    console.log(round);
  })
  .catch((err) => console.log("DB Connection Error:", err));

// Helpers
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 🔹 Create round scoped to tournament
function createRound(players, tournamentId) {
  const tournament = getTournament(tournamentId);
  tournament.roundCount++;

  const sevenMinutesLater = Date.now() + 2 * 60 * 1000;
  const nextRound = Date.now() + 3 * 60 * 1000;
  const shuffledPlayers = shuffleArray(players);

  for (let i = 0; i < shuffledPlayers.length; i += 2) {
    if (i + 1 >= shuffledPlayers.length) break;

    const roomId = `match_${i / 2 + 1}`;
    const { deck, userCards, usedCards, opponentCards, activeCard } = initializeDeck();

    const playerOneState = {
      deck,
      userCards,
      usedCards,
      opponentCards,
      activeCard,
      whoIsToPlay: "user",
      infoText: "It's your turn to make a move now",
      infoShown: true,
      stateHasBeenInitialized: true,
      player: "one",
    };

    tournament.rooms.push({
      room_id: roomId,
      roundOverTime: sevenMinutesLater,
      nextRoundTime: nextRound,
      playerone: shuffledPlayers[i].username,
      playertwo: shuffledPlayers[i + 1].username,
      players: [
        { storedId: shuffledPlayers[i], socketId: shuffledPlayers[i].username, player: "one" },
        { storedId: shuffledPlayers[i + 1], socketId: shuffledPlayers[i + 1].username, player: "two" },
      ],
      playerOneState,
      readyPlayers: [],
      roundInProgress: false,
    });
  }
  return tournament.rooms;
}

const io = require("socket.io")(8080, {
  cors: {
    origin: "http://localhost:3000",
  },
});

// 🔹 SOCKET HANDLERS
io.on("connection", (socket) => {
  // Join Room
  socket.on("join_room", ({ room_id, storedId, tournamentId }) => {
    const tournament = getTournament(tournamentId);
    let { rooms } = tournament;

    if (!room_id) {
      io.to(socket.id).emit("error", "Invalid room ID.");
      return;
    }

    let currentRoom = rooms.find((room) => room.room_id === room_id);
    if (!currentRoom) {
      io.to(socket.id).emit("error", "This room does not exist.");
      return;
    }

    socket.join(room_id);

    currentRoom.players = currentRoom.players.map((p) => {
      if (p.storedId.username === storedId) {
        return { ...p, socketId: socket.id };
      }
      return p;
    });

    const roundtime = currentRoom.roundOverTime;
    io.emit("roundTimer", { roundtime });

    io.emit("playersData", {
      playerOne: {
        username: currentRoom.playerone,
        userImg: currentRoom.players[0].storedId.userImg,
      },
      playerTwo: {
        username: currentRoom.playertwo,
        userImg: currentRoom.players[1].storedId.userImg,
      },
    });

    // Dispatch decks
    if (currentRoom.players[0].storedId.username === storedId) {
      io.to(socket.id).emit("dispatch", {
        type: "INITIALIZE_DECK",
        payload: currentRoom.playerOneState,
      });
    } else if (currentRoom.players[1].storedId.username === storedId) {
      io.to(socket.id).emit("dispatch", {
        type: "INITIALIZE_DECK",
        payload: reverseState(currentRoom.playerOneState),
      });

      let opponent = currentRoom.players.find((p) => p.storedId.username !== storedId);
      if (opponent?.socketId) {
        io.to(opponent.socketId).emit("opponentOnlineStateChanged", true);
      }
    } else {
      io.to(socket.id).emit("error", "This room is already full.");
      return;
    }

    io.to(room_id).emit("confirmOnlineState", storedId, room_id);
  });

  // Get Players Data
  socket.on("getPlayersData", ({ room_id, tournamentId }) => {
    const tournament = getTournament(tournamentId);
    const room = tournament.rooms.find((r) => r.room_id === room_id);
    if (room) {
      io.to(socket.id).emit("playersData", {
        playerOne: {
          username: room.playerone,
          userImg: room.players[0]?.storedId?.userImg || null,
        },
        playerTwo: {
          username: room.playertwo,
          userImg: room.players[1]?.storedId?.userImg || null,
        },
      });
    }
  });

  // Get Round Time
  socket.on("getRoundTime", ({ room_id, tournamentId }) => {
    const tournament = getTournament(tournamentId);
    const room = tournament.rooms.find((r) => r.room_id === room_id);
    if (room) {
      const roundtime = room.roundOverTime;
      io.to(socket.id).emit("roundTimer", { roundtime });
    }
  });

  // Update State
  socket.on("sendUpdatedState", (updatedState, room_id, tournamentId) => {
    const tournament = getTournament(tournamentId);
    const playerOneState = updatedState.player === "one" ? updatedState : reverseState(updatedState);

    tournament.rooms = tournament.rooms.map((room) => {
      if (room.room_id === room_id) {
        return { ...room, playerOneState };
      }
      return room;
    });

    socket.broadcast.to(room_id).emit("dispatch", {
      type: "UPDATE_STATE",
      payload: { playerOneState, playerTwoState: reverseState(playerOneState) },
    });
  });

  // Next Round Timer
  socket.on("next_round_timer", async ({ gameId, tournamentId }) => {
    const tournament = getTournament(tournamentId);
    const leaderboard = await Leaderboard.find({ leaderboardId: tournamentId });

    if (!leaderboard) return;

    const currentRoom = tournament.rooms.find((room) => room.room_id === gameId);
    if (!currentRoom) return;

    io.emit("nextRoundTime", {
      nextRoundTime: currentRoom.nextRoundTime,
      leaderboard,
      ROUNDS_LEFT: 5 - tournament.roundCount,
    });
  });

  // Game Over
  socket.on("game_over", ({ room_id, tournamentId }) => {
    const tournament = getTournament(tournamentId);
    tournament.rooms = tournament.rooms.filter((room) => room.room_id !== room_id);
  });

  // Game Totals
  socket.on("game:totals", ({ userCardTotal, opponentCardsTotal, tournamentId, username, winnerId }) => {
    const tournament = getTournament(tournamentId);
    let { winners, roundCount } = tournament;

    const currentRoom = tournament.rooms.find(
      (room) => room.playerone === username || room.playertwo === username
    );
    if (!currentRoom) return;

    const user = currentRoom.playerone === username ? currentRoom.playerone : currentRoom.playertwo;
    const opponent = currentRoom.playerone === username ? currentRoom.playertwo : currentRoom.playerone;

    let winnerUsername;
    if (winnerId) {
      winnerUsername = winnerId === "user" ? user : opponent;
    } else {
      const decidedWinnerId = userCardTotal < opponentCardsTotal ? "user" : "opponent";
      io.emit("winner", { winnerId: decidedWinnerId });
      winnerUsername = decidedWinnerId === "user" ? user : opponent;
    }

    if (!winners.includes(winnerUsername)) {
      winners.push(winnerUsername);
    }

    if (winners.length === 1) {
      winners.forEach(async (winner) => {
        await Leaderboard.findOneAndUpdate(
          { leaderboardId: tournamentId, username: winner },
          { $inc: { score: 3 } },
          { new: true }
        );
      });

      if (roundCount < 5) {
        io.emit("new_round", { userGameId: currentRoom.room_id, tournamentId });
      }

      if (roundCount === 5) {
        io.emit("tournamentIsOver", { isOver: true, tournamentId });
      }
    }

    tournament.winners = winners;
  });

  // Player Ready
  socket.on("player_ready", ({ room_id, username, tournamentId }) => {
    const tournament = getTournament(tournamentId);
    let room = tournament.rooms.find((r) => r.room_id === room_id);
    if (!room) return;

    room.readyPlayers = room.readyPlayers || [];
    if (!room.readyPlayers.includes(username)) {
      room.readyPlayers.push(username);
    }

    const bothReady =
      room.readyPlayers.includes(room.playerone) && room.readyPlayers.includes(room.playertwo);

    if (bothReady && !room.roundInProgress) {
      room.roundInProgress = true;
      room.readyPlayers = [];
      tournament.winners = [];
      tournament.rooms = [];

      const newRoom = createRound(playersDbs, tournamentId);
      const userGame = newRoom.find(
        (r) => r.playerone === username || r.playertwo === username
      );

      if (userGame) {
        io.emit("start_new_round", { userGameId: userGame.room_id, tournamentId });
      }

      setTimeout(() => {
        room.roundInProgress = false;
      }, 1000);
    }
  });
});
