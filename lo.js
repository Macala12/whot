const initializeDeck = require("./utils/functions/initializeDeck");
const reverseState = require("./utils/functions/reverseState");
const players = require("./controller/dummyData");

const mongoose = require('mongoose');
const express = require("express");
const Leaderboard = require("./models/Leaderboard");
const { fetchPlayers } = require("./controller/fetch_players");

const app = express();
app.use(express.json());

let playersDbs;

mongoose.connect("mongodb+srv://michael-user-1:Modubass1212@assetron.tdmvued.mongodb.net/octagames")
.then(() => {
    console.log("MongoDB Connected");
    return fetchPlayers("68a64d526223e4d5e74daaea");
})
.then(playersDb => {
    playersDbs = playersDb;
    const round = createRound(playersDb);
    console.log(round);
})
.catch(err => console.log("DB Connection Error:", err));

let rooms = []; 
let winners = [];
let ROUND_COUNT = 0;
let ROUNDS_LEFT = ROUND_COUNT--;
const TOTAL_GAMES = 5;

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function createRound(players) {
  ROUND_COUNT++;
  const sevenMinutesLater = Date.now() + 2 * 60 * 1000;
  const nextRound = Date.now() + 3 * 60 * 1000;
  const shuffledPlayers = shuffleArray(players); // randomize player order

  for (let i = 0; i < shuffledPlayers.length; i += 2) {
    if (i + 1 >= shuffledPlayers.length) break; // skip if odd number of players

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

    rooms.push({
      room_id: roomId,
      roundOverTime: sevenMinutesLater,
      nextRoundTime: nextRound,
      playerone: shuffledPlayers[i].username,
      playertwo: shuffledPlayers[i + 1].username,
      players: [
        { storedId: shuffledPlayers[i], socketId: shuffledPlayers[i].username, player: "one" },
        { storedId: shuffledPlayers[i + 1], socketId: shuffledPlayers[i + 1].username, player: "two" }
      ],
      playerOneState,
      readyPlayers:[],
      roundInProgress: false
    });
  }
  return rooms;
}

const io = require("socket.io")(8080, {
  cors: {
    // origin: [
    //   "http://localhost:3000", 
    //   "http://172.20.10.3:3000"
    // ], // React dev server
    origin: "*",
    methods: ["GET", "POST"]
  },
});

io.on("connection", (socket) => {
  // Octagames Join Room Socket
  socket.on("join_room", ({ room_id, storedId }) => {
    // console.log(storedId);

    if (!room_id) {
      io.to(socket.id).emit("error", "No room ID.");
      return;
    }

    let currentRoom = rooms.find((room) => room.room_id === room_id);

    if (!currentRoom) {
      io.to(socket.id).emit("error", "This room does not exist.");
      return;
    }

    socket.join(room_id);

    // Update this player's socketId
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
      }      
    });

    // Player one join/rejoin
    if (currentRoom.players[0].storedId.username === storedId) {
      io.to(socket.id).emit("dispatch", {
        type: "INITIALIZE_DECK",
        payload: currentRoom.playerOneState,
      });
    }
    // Player two join/rejoin
    else if (currentRoom.players[1].storedId.username === storedId) {
      io.to(socket.id).emit("dispatch", {
        type: "INITIALIZE_DECK",
        payload: reverseState(currentRoom.playerOneState),
      });

      // Notify opponent that player two is online
      let opponent = currentRoom.players.find(
        (p) => p.storedId.username !== storedId
      );
      if (opponent?.socketId) {
        io.to(opponent.socketId).emit("opponentOnlineStateChanged", true);
      }
    } else {
      io.to(socket.id).emit("error", "This room is already full.");
      return;
    }

    // ✅ Always confirm online state for everyone in the room
    io.to(room_id).emit("confirmOnlineState", storedId, room_id);
  });

  socket.on("getPlayersData", ({ room_id }) => {
    const room = rooms.find(r => r.room_id === room_id);
    if (room) {
      io.to(socket.id).emit("playersData", {
        playerOne: {
          username: room.playerone,
          userImg: room.players[0]?.storedId?.userImg || null,
        },
        playerTwo: {
          username: room.playertwo,
          userImg: room.players[1]?.storedId?.userImg || null,
        }
      });
    }
  });

  socket.on("getRoundTime", ({ room_id }) => {
    const room = rooms.find(r => r.room_id === room_id);

    if (room) {
      const roundtime = room.roundOverTime; // 👈 your round timer value
      io.to(socket.id).emit("roundTimer", { roundtime });
    }
  });

  //Default Join Room Socket
  // socket.on("join_room", ({ room_id, storedId }) => {
  //   if (room_id?.length !== 4) {
  //     io.to(socket.id).emit(
  //       "error",
  //       "Sorry! Seems like this game link is invalid. Just go back and start your own game 🙏🏾."
  //     );
  //     return;
  //   }

  //   socket.join(room_id);
  //   let currentRoom = rooms.find((room) => room.room_id == room_id);
  //   if (currentRoom) {
  //     let currentPlayers = currentRoom.players;

  //     // setInterval(() => {
  //     //   if (currentPlayers.length === 1) {
  //     //     // const timeout = setTimeout(() => {
  //     //     //     io.to(socket.id).emit("Opponent Timed Out");
  //     //     // }, 0.2 * 60 * 1000);
  //     //     console.log("one players");
  //     //     socket.emit("onePlayerOnline", { msg: "true" });
  //     //   }else{
  //     //     console.log("two players");
  //     //     socket.emit("onePlayerOnline", { msg: "false" });
  //     //   }
  //     // }, 1000);

  //     if (currentPlayers.length == 1) {
  //       // If I'm the only player in the room, get playerOneState, and update my socketId
  //       if (currentPlayers[0].storedId == storedId) {
  //         io.to(socket.id).emit("dispatch", {
  //           type: "INITIALIZE_DECK",
  //           payload: currentRoom.playerOneState,
  //         });

  //         rooms = rooms.map((room) => {
  //           if (room.room_id == room_id) {
  //             return {
  //               ...room,
  //               players: [{ storedId, socketId: socket.id, player: "one" }],
  //             };
  //           }
  //           return room;
  //         });
  //       } else {
  //         rooms = rooms.map((room) => {
  //           if (room.room_id == room_id) {
  //             return {
  //               ...room,
  //               players: [
  //                 ...room.players,
  //                 { storedId, socketId: socket.id, player: "two" },
  //               ],
  //             };
  //           }
  //           return room;
  //         });

  //         io.to(socket.id).emit("dispatch", {
  //           type: "INITIALIZE_DECK",
  //           payload: reverseState(currentRoom.playerOneState),
  //         });

  //         // Check if my opponent is online
  //         socket.broadcast.to(room_id).emit("confirmOnlineState");

  //         let opponentSocketId = currentPlayers.find(
  //           (player) => player.storedId != storedId
  //         ).socketId;
  //         io.to(opponentSocketId).emit("opponentOnlineStateChanged", true);
  //       }
  //     } else {
  //       // Check if player can actually join room, after joining, update his socketId
  //       let currentPlayer = currentPlayers.find(
  //         (player) => player.storedId == storedId
  //       );
  //       if (currentPlayer) {
  //         io.to(socket.id).emit("dispatch", {
  //           type: "INITIALIZE_DECK",
  //           payload:
  //             currentPlayer.player == "one"
  //               ? currentRoom.playerOneState
  //               : reverseState(currentRoom.playerOneState),
  //         });

  //         rooms = rooms.map((room) => {
  //           if (room.room_id == room_id) {
  //             return {
  //               ...room,
  //               players: [...room.players].map((player) => {
  //                 if (player.storedId == storedId) {
  //                   return {
  //                     storedId,
  //                     socketId: socket.id,
  //                     player: currentPlayer.player,
  //                   };
  //                 }
  //                 return player;
  //               }),
  //             };
  //           }
  //           return room;
  //         });

  //         let opponentSocketId = currentPlayers.find(
  //           (player) => player.storedId != storedId
  //         ).socketId;
  //         io.to(opponentSocketId).emit("opponentOnlineStateChanged", true);

  //         // Check if my opponent is online
  //         socket.broadcast.to(room_id).emit("confirmOnlineState");
  //       } else {
  //         io.to(socket.id).emit(
  //           "error",
  //           "Sorry! There are already two players on this game, just go back and start your own game 🙏🏾."
  //         );
  //       }
  //     }
  //   } else {
  //     // Add room to store
  //     const { deck, userCards, usedCards, opponentCards, activeCard } =
  //       initializeDeck();

  //     const playerOneState = {
  //       deck,
  //       userCards,
  //       usedCards,
  //       opponentCards,
  //       activeCard,
  //       whoIsToPlay: "user",
  //       infoText: "It's your turn to make a move now",
  //       infoShown: true,
  //       stateHasBeenInitialized: true,
  //       player: "one",
  //     };

  //     rooms.push({
  //       room_id,
  //       players: [
  //         {
  //           storedId,
  //           socketId: socket.id,
  //           player: "one",
  //         },
  //       ],
  //       playerOneState,
  //     });

  //     io.to(socket.id).emit("dispatch", {
  //       type: "INITIALIZE_DECK",
  //       payload: playerOneState,
  //     });
  //   }
  // });

  socket.on("sendUpdatedState", (updatedState, room_id) => {
    const playerOneState =updatedState.player === "one" ? updatedState : reverseState(updatedState);
    const playerTwoState = reverseState(playerOneState);

    rooms = rooms.map((room) => {
      if (room.room_id === room_id) {
        return { ...room, playerOneState };
      }
      return room;
    });

    socket.broadcast.to(room_id).emit("dispatch", {
      type: "UPDATE_STATE",
      payload: { playerOneState, playerTwoState },
    });
  });

  socket.on("next_round_timer", async (gameId) => {
    const leaderboard = await Leaderboard.find({ leaderboardId: '68a64d526223e4d5e74daaea' });

    if (!leaderboard) {
      console.log('Could not find leaderboard');
      return;
    }

    const currentRoom = rooms.find((room) => room.room_id === gameId.gameId);
    if (!currentRoom) {
      console.log(`Room with id ${gameId.gameId} not found`);
      return;
    }

    const nextRoundTime = currentRoom.nextRoundTime;    

    io.emit("nextRoundTime", { nextRoundTime: nextRoundTime, leaderboard, ROUNDS_LEFT });
  });

  socket.on("game_over", (room_id) => {
    rooms = rooms.filter((room) => room.room_id !== room_id);
  });

  socket.on("disconnect", () => {
    let currentRoom = rooms.find((room) =>
      room.players.some((player) => player.socketId === socket.id)
    );
    if (currentRoom) {
      let opponentSocketId = currentRoom.players.find(
        (player) => player.socketId !== socket.id
      )?.socketId;
      if (opponentSocketId) {
        io.to(opponentSocketId).emit("opponentOnlineStateChanged", false);
      }
    }
  });

  socket.on("confirmOnlineState", (storedId, room_id) => {
    let currentRoom = rooms.find((room) => room.room_id === room_id);
    if (!currentRoom) return;

    console.log("confirmOnlineState ran for", storedId);

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

  // socket.on("game:totals", ({ userCardTotal, opponentCardsTotal, tournamentId, username }) => {
  //   // Decide winner ONCE
  //   let winnerId;
  //   if (userCardTotal > opponentCardsTotal) {
  //     winnerId = "opponent"; 
  //   } else {
  //     winnerId = "user";
  //   }

  //   // Emit winner to BOTH players
  //   io.emit("winner", { winnerId });

  //   let usernameOne, usernameTwo;

  //   const currentRoom = rooms.find(
  //     (room) => room.playerone === username || room.playertwo === username
  //   );

  //   if (currentRoom) {
  //     if (currentRoom.playerone === username) {
  //       usernameOne = currentRoom.playerone;
  //     } else {
  //       usernameTwo = currentRoom.playertwo;
  //     }
  //   }
    
  //   if (winnerId === "user") {
  //     winnerId = usernameOne;
  //   }else{
  //     winnerId = usernameTwo;
  //   }

  //   // Store winner in the array
  //   winners.push(winnerId);

  //   // Check if we reached the required number of games
  //   if (winners.length >= TOTAL_GAMES) {
  //     console.log("All winners collected:", winners);

  //     winners.forEach(async winner => {
  //       // 🔹 Update your database here with the winners array
  //       const updateWinners = await Leaderboard.findOneAndUpdate({ leaderboardId: tournamentId, username: winner }, { $inc: { score: 3 } });
  //       if (updateWinners) {
  //         // // Clear array for next batch
  //         // const newRound = true;

  //         // const timestamp = Date.now();
  //         // const time = timestamp + 2 * 60 * 1000;

  //         // if (newRound === true) {
  //         //   io.emit("start_timeout", { time });
  //         //   setTimeout(() => {
  //         //     // createRound(players);
  //         //     console.log("start new round")
  //         //   }, 2 * 60 * 1000);
  //         // }
  //         // winners.length = 0; 

  //         console.log("Updated Score");
  //       }
  //     });
  //   }
  // });

  socket.on("game:totals", ({ userCardTotal, opponentCardsTotal, tournamentId, username, winnerId }) => {
    let winnerUsername;

    const currentRoom = rooms.find(
      (room) => room.playerone === username || room.playertwo === username
    );

    if (!currentRoom) return;

    const user = currentRoom.playerone === username ? currentRoom.playerone : currentRoom.playertwo;
    const opponent = currentRoom.playerone === username ? currentRoom.playertwo : currentRoom.playerone;

    if (winnerId) {
      // Winner already decided by frontend
      winnerUsername = winnerId === "user" ? user : opponent;
    } else {
      // Decide winner from totals
      const decidedWinnerId = userCardTotal < opponentCardsTotal ? "user" : "opponent";
      io.emit("winner", { winnerId: decidedWinnerId });

      // Send player data once
      io.emit("playersDataGame", {
        playerOne: {
          username: currentRoom.playerone,
          userImg: currentRoom.players[0].storedId.userImg,
        },
        playerTwo: {
          username: currentRoom.playertwo,
          userImg: currentRoom.players[1].storedId.userImg,
        },
      });
      console.log("Sent player Data");
      

      winnerUsername = decidedWinnerId === "user" ? user : opponent;
    }

    // ✅ Add winner if not already stored
    if (!winners.includes(winnerUsername)) {
      winners.push(winnerUsername);
      console.log(`${winnerUsername} has been added`)
      console.log(winners);
    }

    // ✅ Check if all rooms have winners
    if (winners.length === 1) {
      console.log("All winners collected:", winners);

      winners.forEach(async (winner) => {
        try {
          const updateWinners = await Leaderboard.findOneAndUpdate(
            { leaderboardId: "68a64d526223e4d5e74daaea", username: winner },
            { $inc: { score: 3 } },
            { new: true }
          );

          if (updateWinners) {
            console.log(`Updated score for ${winner}`);
          }
        } catch (err) {
          console.error("Error updating winner:", err);
        }
      });

      if (ROUND_COUNT < 5) {
        io.emit("new_round", {userGameId: currentRoom.room_id, toLeaderboard: true})
      }

      if (ROUND_COUNT === 5) {
        io.emit("tournamentIsOver", { isOver: true });
      }
    }
  });

  socket.on("send_id", ({ id }) => {
    let realRoom = rooms.find((room) => room.playerone === id);
    if (!realRoom) {
      let realRoomTwo = rooms.find((room) => room.playertwo === id);
      if (realRoomTwo) {
        // console.log("Found Player:", realRoomTwo);
        const room_id = realRoomTwo.room_id;
        io.emit("get_match_id", { room_id });
      }else{
        io.to(socket.id).emit("error", "This is not your play link...")
      }
    }else{
        // console.log("Found Player:", realRoom);
        const room_id = realRoom.room_id;
        io.emit("get_match_id", { room_id });
    }
  });

  socket.on("player_ready", ({ room_id, username }) => {
    if (ROUND_COUNT < 5) {
      console.log("Player Ready Call; ", room_id, username);
      
      const room = rooms.find(r => r.room_id === room_id);
      if (!room) return;

      // Ensure readyPlayers list exists
      room.readyPlayers = room.readyPlayers || [];

      // Mark this player as ready
      if (!room.readyPlayers.includes(username)) {
        room.readyPlayers.push(username);
        console.log(`${username} is ready in room ${room_id}`);
      }

      // Check if both players are ready
      const bothReady = 
        room.readyPlayers.includes(room.playerone) &&
        room.readyPlayers.includes(room.playertwo);

      if (!room.roundInProgress) {
        room.roundInProgress = true; // 🔒 Lock round creation
        room.readyPlayers = [];      // Reset readiness for next round

        // Actually create the round
        winners = []; // Reset winners
        rooms = []; // Reset Rooms
        const newRoom = createRound(playersDbs);
        console.log(newRoom);

        const userGame = newRoom.find(
          (room) => room.playerone === username || room.playertwo === username
        );

        console.log(ROUND_COUNT, " rounds is left");

        if (userGame) {
          console.log(`✅ Starting new round in room ${userGame.room_id}`);
          io.emit("start_new_round", { 
            userGameId: userGame.room_id, 
          });
          console.log("Started New Round");
          

          // Unlock after setup (optional timeout safety)
          setTimeout(() => {
            room.roundInProgress = false;
          }, 1000);
        }
      }
    }
  });
});
