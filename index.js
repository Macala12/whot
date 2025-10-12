const initializeDeck = require("./utils/functions/initializeDeck");
const reverseState = require("./utils/functions/reverseState");

const mongoose = require("mongoose");
const express = require("express");
const Leaderboard = require("./models/Leaderboard");
const { fetchPlayers } = require("./controller/fetch_players");

const app = express();
app.use(express.json());

const cors = require('cors');

const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:4000", "https://octagames-whot.onrender.com/"],  // or "*" to allow all
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// DB connect
let playersDbs;
mongoose.connect("mongodb+srv://michael-user-1:Modubass1212@assetron.tdmvued.mongodb.net/octagames")
.then(() => {
  console.log("MongoDB Connected");
  // hardcoded();
})
.catch((err) => console.log("DB Connection Error:", err));


//Hardcoded
async function hardcoded() {
  const players = await fetchPlayers("68dd869c8c9854acf5ad1a1d");

if (players.success) {
  const result = createRound(players.players, "68dd869c8c9854acf5ad1a1d");

  if (result.success) {
    console.log(result.rooms);
  }
}
}

// 🔹 Tournament store
let tournaments = {};
function getTournament(tournamentId) {
  if (!tournaments[tournamentId]) {
    tournaments[tournamentId] = {
      rooms: [],
      winners: [],
      roundCount: 0,
      isCreatingRound: false, // ✅ prevents concurrent round creation
      roundPromise: null,       // ✅ will hold a Promise object (not just false)
      newRoomCreated: false
    };
  } else {
    // Ensure helper fields exist (for older tournaments or restored state)
    const t = tournaments[tournamentId];
    if (typeof t.isCreatingRound === "undefined") t.isCreatingRound = false;
    if (typeof t.roundPromise === "undefined") t.roundPromise = null;
    if (!Array.isArray(t.rooms)) t.rooms = [];
    if (!Array.isArray(t.winners)) t.winners = [];
  }

  return tournaments[tournamentId];
}

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
  if (!tournament) {
    return { success: false, message: "Tournament not found" };
  }

  tournament.roundCount++;

  if (!players || players.length < 2) {
    return { success: false, message: "Not enough players to create a round" };
  }

  const sevenMinutesLater = Date.now() + 1.3 * 60 * 1000;
  const nextRound = Date.now() + 2.3 * 60 * 1000;
  const shuffledPlayers = shuffleArray(players);

  for (let i = 0; i < shuffledPlayers.length; i += 2) {
    if (i + 1 >= shuffledPlayers.length) break;

    const randomVal = Math.random().toString(36);

    const roomId = `match_${i / 2 + 1}_${randomVal}`;
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
  return { success: true, message: "Round created", rooms: tournament.rooms };
}

function endTournament(tournamentId) {
  const tournament = getTournament(tournamentId);
  if (!tournament) {
    return { success: false, message: "Tournament not found" };
  }
  
  // Loop through all rooms in this tournament
  tournament.rooms.forEach(room => {

    const players = [
      { username: room.playerone, socketId: room.p1SocketId, room_id: room.room_id },
      { username: room.playertwo, socketId: room.p2SocketId, room_id: room.room_id }
    ];

    players.forEach(async player => {
      io.to(player.room_id).emit("tournamentHasEnded", {
        roomId: player.room_id,
        tournamentId,
        message: "The tournament has ended."
      });

      const socketsInRoom = await io.in(room.room_id).fetchSockets();
      for (const socket of socketsInRoom) {
        socket.leave(room.room_id);
      }

      io.to(player.room_id).emit("tournamentIsOver", { isOver: true, tournamentId });
    });

  });

  // Clear all rooms from the tournament
  tournament.rooms = [];

  // Optionally, delete the tournament entirely
  deleteTournament(tournamentId); // <-- implement this function to remove from memory/DB

  console.log(`Tournament ${tournamentId} has ended and all rooms removed.`);
  return { success: true, message: "Tournament ended successfully" };
}

function deleteTournament(tournamentId) {
  if (tournaments[tournamentId]) {
    delete tournaments[tournamentId];
    console.log(`Tournament ${tournamentId} deleted from memory.`);
  } else {
    console.log(`Tournament ${tournamentId} not found.`);
  }
}

app.get("/api/create", async (req, res) => {  
  try {
    const { tournamentId } = req.query;    

    if (!tournamentId) {
      return res.status(400).json({ error: "Missing tournamentId" });
    }

    const players = await fetchPlayers(tournamentId);

    if (!players.success) {
      return res.status(404).json({ error: players.message });
    }    

    const result = createRound(players.players, tournamentId);

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    return res.json({
      success: true,
      message: result.message,
      rooms: result.rooms // optional, useful if frontend needs to know
    });  

  } catch (error) {
    console.error("Error creating tournament round:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/end", async (req, res) => {
  try {
      const { tournamentId } = req.query;

      if (!tournamentId) {
        return res.status(400).json({ error: "Missing tournamentId" });
      }

      const result = endTournament(tournamentId);

      if (!result.success) {
        return res.status(404).json({ error: result.message });
      }

      return res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error("Error ending tournament:", error);
      res.status(500).json({ error: "Server error" });
    }
});

const io = require("socket.io")(server, {
  cors: {
    origin: [
      "http://localhost:3000", 
      "http://localhost:4000",
      "http://172.20.10.3:3000",
      "https://octagames-whot.onrender.com/"
    ], // React dev server
    // origin: "*",
    methods: ["GET", "POST"]
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
      io.to(socket.id).emit("error", "This room does not exist or Tournament has Ended");
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
      io.to(socket.id).emit("roundTimer", { roundtime });

      io.to(socket.id).emit("playersData", {
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
      let currentRoom = rooms.find(
        (room) => room.players[0] === storedId || room.players[1] === storedId
      );

      if (currentRoom) {
        const actual_match_id = currentRoom.room_id;
        io.to(socket.id).emit("wrongRoomCorrection", actual_match_id);
      }
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
      io.to(room_id).emit("roundTimer", { roundtime });
    }
  });

  socket.on("specialMoveCall", ({ room_id, tournamentId, move, whoPlayed }) => {
    io.to(room_id).emit("specialMoveReceive", {specialMove: move, whoPlayed: whoPlayed});
  });

  socket.on("wastedTime", ({ room_id, tournamentId, username }) => {
    io.to(room_id).emit("setWastedTime", { value: true, username: username });
  });

  // Update State
  socket.on("sendUpdatedState", (updatedState, room_id, tournamentId) => {
    const tournament = getTournament(tournamentId);
    if (!tournament) return;

    // Determine playerOneState
    const playerOneState =
      updatedState.player === "one" ? updatedState : reverseState(updatedState);

    const playerTwoState = reverseState(playerOneState);

    // Update both player states in the room
    tournament.rooms = tournament.rooms.map((room) => {
      if (room.room_id === room_id) {
        return {
          ...room,
          playerOneState,
          playerTwoState,
        };
      }
      return room;
    });

    // Emit updated state to all clients in the room (including sender)
    io.to(room_id).emit("dispatch", {
      type: "UPDATE_STATE",
      payload: {
        playerOneState,
        playerTwoState,
      },
    });
  });

  // Next Round Timer
  socket.on("next_round_timer", async ({ gameId, tournamentId }) => {
    const tournament = getTournament(tournamentId);
    const leaderboard = await Leaderboard.find({ leaderboardId: tournamentId });

    if (!leaderboard) return;

    const currentRoom = tournament.rooms.find((room) => room.room_id === gameId);
    if (!currentRoom) return;

      io.to(currentRoom.room_id).emit("nextRoundTime", {
      nextRoundTime: currentRoom.nextRoundTime,
      leaderboard,
      ROUNDS_LEFT: 5 - tournament.roundCount,
    });

    
  });

  socket.on("disconnect", (tournamentId) => {
    const tournament = getTournament(tournamentId);
    let currentRoom = tournament.rooms.find((r) => r.players.some((player) => player.socketId === socket.id));

    if (currentRoom) {
      let opponentSocketId = currentRoom.players.find(
        (player) => player.socketId !== socket.id
      )?.socketId;
      if (opponentSocketId) {
        io.to(opponentSocketId).emit("opponentOnlineStateChanged", false);
      }
    }
  });

  socket.on("endTournamentRoom", ({ tournamentId, roomId }) => {
    
    
    const tournament = getTournament(tournamentId);
    if (!tournament) return;

    // ✅ Find the room directly
    const room = tournament.rooms.find(r => r.room_id === roomId);
    if (!room) {
      io.to(roomId).emit("tournamentHasEnded", {
        roomId,
        tournamentId,
        message: "The tournament has ended."
      });
      return;
    }

    // 1️⃣ Notify all players in that room
    room.players.forEach(player => {
      io.to(roomId).emit("tournamentHasEnded", {
        roomId,
        tournamentId,
        message: "The tournament has ended."
      });

      // 2️⃣ Remove each socket from the room
      const playerSocket = io.sockets.sockets.get(roomId);
      if (playerSocket) {
        playerSocket.leave(roomId);
      }
    });

    // 3️⃣ Remove the room from the array safely
    tournament.rooms = tournament.rooms.filter(r => r.room_id !== roomId);

    console.log(`✅ Tournament room ${roomId} ended and removed.`);
  });

  socket.on("confirmOnlineState", (storedId, room_id, tournamentId) => {
    const tournament = getTournament(tournamentId);
    let currentRoom = tournament.rooms.find((r) => r.room_id === room_id);

    if (!currentRoom) return;

    // Find the joining player
    let thisPlayer = currentRoom.players.find(
      (p) => p.storedId.username === storedId
    );    

    // Find the opponent
    let opponent = currentRoom.players.find(
      (p) => p.storedId.username !== storedId
    );

    // Mark *this player* as online
    if (thisPlayer?.socketId) {
      io.to(thisPlayer.socketId).emit("userOnlineStateChanged", true);
    }

    // Also tell the opponent this player is online
    if (opponent?.socketId) {
      io.to(opponent.socketId).emit("opponentOnlineStateChanged", true);
    }
  });

  // Game Over
  socket.on("game_over", ({ room_id, tournamentId }) => {
    const tournament = getTournament(tournamentId);
    tournament.rooms = tournament.rooms.filter((room) => room.room_id !== room_id);
  });

  socket.on("timeOut", () => {
    socket.emit("goingToNewRound");
    socket.emit("roundEnded");
  });

  // Game Totals
  socket.on("game:totals", ({ userCardTotal, opponentCardsTotal, tournamentId, username, winnerId, tournament_id }) => {
    const tournament = getTournament(tournament_id);
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
      io.to(currentRoom.room_id).emit("winner", { winnerId: decidedWinnerId });
      winnerUsername = decidedWinnerId === "user" ? user : opponent;
    }

    if (!winners.includes(winnerUsername)) {
      winners.push(winnerUsername);
    }

    if (winners.length === 1) {
      winners.forEach(async (winner) => {
        const updatescore = await Leaderboard.findOneAndUpdate(
          { leaderboardId: tournament_id, username: winner },
          { $inc: { score: 3 } },
          { new: true }
        );

        if (updatescore) {
          console.log(`Update score for ${winner}`);
        }
      });
      
      if (roundCount === 1) {
          io.to(currentRoom.room_id).emit("tournamentIsOver", { isOver: true, tournamentId });
      }else{
        if (roundCount < 2) {
            io.to(currentRoom.room_id).emit("new_round", { userGameId: currentRoom.room_id, toLeaderboard: true });
        }
      }
    }
  });

  socket.on("send_id", ({ id, tournamentId }) => {
    const tournament = getTournament(tournamentId);
    let realRoom = tournament.rooms.find((r) => r.playerone === id);    
    if (!realRoom) {
      let realRoomTwo = tournament.rooms.find((r) => r.playertwo === id);
      if (realRoomTwo) {
        const room_id = realRoomTwo.room_id;
          io.to(socket.id).emit("get_match_id", { room_id });
      }else{
        io.to(socket.id).emit("error", "This is not your play link...")
      }
    }else{
        const room_id = realRoom.room_id;
          io.to(socket.id).emit("get_match_id", { room_id });
    }
  });

  // Player Ready
  socket.on("player_ready", async ({ room_id, username, tournamentId }) => {
    const tournament = getTournament(tournamentId);
    if (!tournament) return;
    
    tournament.isCreatingRound = true;

    // Ensure helper fields exist
    if (!tournament.rooms) tournament.rooms = [];
    if (!tournament.roundPromise) tournament.roundPromise = null;
    if (typeof tournament.isCreatingRound === "undefined") {
      tournament.isCreatingRound = false;
    }

    // 🕐 If round creation is already happening — wait for it
    if (tournament.isCreatingRound && tournament.roundPromise) {
      console.log(`[${username}] waiting for current round to finish...`);
      try {
        const assignments = await tournament.roundPromise;
        const userRoom = assignments[username];
        if (userRoom) {
          io.to(socket.id).emit("start_new_round", {
            assignments: { [username]: userRoom },
            tournamentId,
          });
        }
      } catch (err) {
        console.error(`[${username}] failed to get new round:`, err);
      }
      return;
    }

    // 🧭 If tournament already has rooms ready — just assign player
    if (!tournament.isCreatingRound || tournament.isCreatingRound === "false") {  
      if (tournament.newRoomCreated || tournament.newRoomCreated === "true") {
        const existingRoom = tournament.rooms.find(
          (r) => r.playerone === username || r.playertwo === username
        );
        if (existingRoom) {
          io.to(socket.id).emit("start_new_round", {
            assignments: { [username]: existingRoom.room_id },
            tournamentId,
          });
          return;
        }
      }
    }

    // 🛑 Acquire lock
    console.log(`[${username}] creating new round...`);

    // Create a Promise that others can await
    let resolvePromise, rejectPromise;
    tournament.roundPromise = new Promise((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });

    try {
      // Create new rooms
      tournament.rooms = [];
      const playersDbs = await fetchPlayers(tournamentId);
      if (!playersDbs.success) {
        console.log("Could not fetch players");
      }

      const result = createRound(playersDbs.players, tournamentId);
      if (!result.success || !result.rooms) {
        throw new Error(result.message || "Round creation failed");
      }

      tournament.rooms = result.rooms;

      // Build assignments map
      const assignments = {};
      result.rooms.forEach((room) => {
        assignments[room.playerone] = room.room_id;
        assignments[room.playertwo] = room.room_id;
      });

      // ✅ Resolve the shared promise so any waiting players get their rooms
      resolvePromise(assignments);

      // Notify all connected players in this tournament room
      io.to(room_id).emit("start_new_round", { assignments, tournamentId });

      console.log("✅ Created new round successfully!");
    } catch (err) {
      rejectPromise(err);
      console.error("❌ Error creating new round:", err);
    } finally {
      // Release lock safely and clear promise
      setTimeout(() => {
        tournament.isCreatingRound = false;
        tournament.roundPromise = null;
        tournament.newRoomCreated = true;
      }, 250);
    }
  });

});
