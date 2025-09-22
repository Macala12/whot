import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import confetti from "canvas-confetti";
import confettiAnimation from "../../utils/functions/confettiAnimation";
import socket from "../../socket/socket";
import "../RoundOver/index.css";
import CardComponent from "../CardComponent/CardComponent";
import { useNavigate } from "react-router-dom";


function RoundOver() {
  const navigate = useNavigate();
  const tournament_Id = sessionStorage.getItem("tID");
  const userCards = useSelector((state) => state.userCards);
  const opponentCards = useSelector((state) => state.opponentCards);
  const tournamentId = sessionStorage.getItem("gameId");
  const username = localStorage.getItem("storedId");
  const gameOver = sessionStorage.getItem("gameOver");
  const [playerData, setPlayerData] = useState({
    playerOne: { username: "", userImg: "" },
    playerTwo: { username: "", userImg: "" }
  });

  const userCardTotal = userCards.reduce((acc, card) => acc + card.number, 0);
  const opponentCardsTotal = opponentCards.reduce(
    (acc, card) => acc + card.number,
    0
  );

  const [countdown, setCountdown] = useState(null);
  const [winner, setWinner] = useState(null);

  // Send totals to server once available
  useEffect(() => {
    if (userCardTotal && opponentCardsTotal) {
      let winnerId;      
      if (gameOver === "normal") {
        if (userCards.length === 0) {
          winnerId = "user";
        }else if (opponentCards.length === 0) {
          winnerId = "opponent";
        }
        socket.emit("timeOut");
      } 
      
      else if (gameOver === "timedOut") {
        winnerId = "user";
        socket.emit("timeOut");
      }
      
      else{
        sessionStorage.setItem("gameOver", "countCard")
        if (userCardTotal < opponentCardsTotal) {
          winnerId = "user";
          setWinner(winnerId);
        }else if (userCardTotal === opponentCardsTotal) {
          winnerId = "";
        }else if(opponentCardsTotal < userCardTotal){
          winnerId = "opponent";
          setWinner(winnerId);
        }
        if (winnerId === "user") {
          confettiAnimation(confetti);
        }
      }

      socket.emit("game:totals", {
        userCardTotal,
        opponentCardsTotal,
        tournamentId,
        username,
        winnerId,
        tournament_id: tournament_Id
      });
    }
  }, [userCardTotal, opponentCardsTotal, opponentCards.length, userCards.length, tournamentId, gameOver, username]);

  useEffect(() => {
    socket.on("playersData", (data) => {
      setPlayerData({
        playerOne: data.playerOne,
        playerTwo: data.playerTwo
      });
    });

    socket.emit("getPlayersData", { room_id: tournamentId, tournamentId: tournament_Id });

    return () => socket.off("playersData");
  }, [tournamentId]);

  useEffect(() => {
    socket.on("winner", ({ winnerId }) => {
      setWinner(winnerId);
      console.log(winnerId);
      
      if (winnerId === "user") {
          confettiAnimation(confetti);
      }
    });

    socket.on("new_round", ({ userGameId, toLeaderboard }) => {
      localStorage.removeItem("waitingEndTime"); // reset for next round
      console.log(toLeaderboard);
      
      if (toLeaderboard === true || toLeaderboard === "true") {
        setCountdown("5")
        setTimeout(() => {
          sessionStorage.removeItem("gameOver");
          navigate(`/leaderboard/${userGameId}`);
        }, 5000);
      }
    });

    socket.on("tournamentIsOver", ({ isOver }) => {
      if (isOver) {
        localStorage.removeItem("waitingEndTime"); // remove all Stored Information
        sessionStorage.removeItem("gameOver");
        localStorage.removeItem("storedId");
        sessionStorage.removeItem("gameId");

        socket.emit("endTournamentRoom", { tournamentId: tournament_Id, room_id: tournamentId} );
      }
    });

    socket.on("tournamentHasEnded", (data) => {
      navigate(`/tournamentOver/${data.tournamentId}`);
    });

    socket.on("start_timeout", ({ time }) => {
      const endTime = new Date(time).getTime();

      const interval = setInterval(() => {
        const now = Date.now();
        const distance = endTime - now;

        if (distance <= 0) {
          clearInterval(interval);
          setCountdown("0:00");
          alert("redirecting");
          return;
        }

        const minutes = Math.floor(
          (distance % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setCountdown(`${minutes}:${seconds < 10 ? "0" : ""}${seconds}`);
      }, 1000);
    });

    return () => {
      socket.off("winner");
      socket.off("start_new_round");
    };

  }, [navigate]);

  const userStatus = winner === "user" ? "You Won" : "You Lost";

  // if (gameOver) {
  //   return null; // 👈 don't render round over UI if game ended early
  // }

  return (
    <div className="roundOverContainer">
      {["timedOut", "normal"].includes(gameOver) ? (
        // 👇 If game is over (timed out OR normal)
        <h4>Game Over</h4>
      ) : (
        // 👇 Full RoundOver UI if gameOver is something else (e.g. false/null)
        <>
          <h4>Round Over</h4>
          <h5 className={winner === "user" ? "status won" : "status lost"}>
            {userStatus}
          </h5>

          <div className="roundoverBox">
            {/* User */}
            <div>
              <div className="img_box">
                <img
                  src={
                    playerData.playerOne.userImg ||
                    "https://api.dicebear.com/9.x/big-smile/svg?seed=user"
                  }
                  alt="User Avatar"
                />
              </div>
              <h6>{playerData.playerOne.username || username}</h6>
              <h4>
                {playerData.playerOne.username === username
                  ? userCardTotal
                  : opponentCardsTotal}
              </h4>

              <div className="grid">
                {userCards.map((card) => (
                  <CardComponent
                    key={card.shape + card.number}
                    shape={card.shape}
                    number={card.number}
                    isMine={true}
                    isShown={true}
                  />
                ))}
              </div>
            </div>

            {/* Opponent */}
            <div>
              <div className="img_box">
                <img
                  src={
                    playerData.playerTwo.userImg ||
                    "https://api.dicebear.com/9.x/big-smile/svg?seed=opponent"
                  }
                  alt="Opponent Avatar"
                />
              </div>
              <h6>{playerData.playerTwo.username}</h6>
              <h4>
                {playerData.playerTwo.username === username
                  ? userCardTotal
                  : opponentCardsTotal}
              </h4>
            </div>
          </div>
        </>
      )}

      {/* 👇 Only show countdown if it has started */}
      {countdown !== null && (
        <p>
          Going to next round in <b>{countdown}</b>
        </p>
      )}
    </div>
  );
}

export default RoundOver;
