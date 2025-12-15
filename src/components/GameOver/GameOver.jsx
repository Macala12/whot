import React, { useEffect, useState } from "react";
import style from "./index.module.css";
import useIsGameOver from "../../utils/hooks/useIsGameOver";
import confetti from "canvas-confetti";
import confettiAnimation from "../../utils/functions/confettiAnimation";
<<<<<<< HEAD
import win from "../../assets/win.png";
import lose from "../../assets/lose.png";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

function GameOver({ winner }) {
  const API_BASE_URL = 'http://localhost:3000';
  const { userid, gameid, key } = useParams();
=======
import socket from "../../socket/socket"; 

function GameOver({ winner }) {
>>>>>>> f24306954684fce65c0df09a8e799635242b50a8
  const isGameOver = useIsGameOver();
  const [animationHasRun, setAnimationHasRun] = useState(false);
  const [waiting, setWaitingText] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false); // <-- NEW STATE

<<<<<<< HEAD
  let title;
  let subtitle;
  let state;

  if (winner) {
    sessionStorage.setItem("is_gameOver", true);

    if (winner === "user") {
      title = "YOU WIN";
      subtitle = "Congrats! You won this round.";
      state = "won";
    }else if (winner === "opponent") {
      title = "YOU LOST😔";
      subtitle = "Sorry, just try again.";
      state = "lost";
    }else{
      title = "YOU DREW";
      subtitle = "Congrats! You drew this round. Try again";
      state = "draw";
    }

    if (!animationHasRun) {
        confettiAnimation(confetti);
        setAnimationHasRun(true);
    }
  }else{
      if(isGameOver().answer){
        sessionStorage.setItem("is_gameOver", true);
      }
      title = isGameOver().winner === "user" ? "YOU WIN" : "YOU LOST😔";
      state = isGameOver().winner === "user" ? "won" : "lost";
      if (isGameOver.winner === "draw") {
        title = "YOU DREW";
        state = "draw";
      }
      subtitle = isGameOver().winner === "user"
          ? "Congrats! You won this round."
          : "Sorry, just try again.";

      if (isGameOver.winner === "draw") {
        subtitle = "Congrats! You drew this round. Try again";
      }
  }
    useEffect(() => {
      if (isGameOver().winner === "user" && !animationHasRun) {
        confettiAnimation(confetti);
        setAnimationHasRun(true);
      }
    }, [isGameOver]);

    useEffect(() => {
      const gameOver = async () => {
        const response = await fetch(`${API_BASE_URL}/end_game`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userid,
            id: gameid,
            state: state
          })
        });

        const result = await response.json();
        console.log(result);
      };

      gameOver();
    }, []); // runs once


    const playAgain = async () =>  {
        const response = await fetch(`${API_BASE_URL}/new_game`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userid: userid,
                id: gameid,
                key: key
            })
        });
        const result = await response.json();

        if (result.status) {
            sessionStorage.clear();
            window.location.href = `http://127.0.0.1:8080?userid=${result.payload.userid}&id=${result.payload.gameid}`   
        }else{
            console.log("failed");
        }
    }
=======
  // Prefer winner prop if passed, otherwise fall back to hook
  const finalWinner = winner || isGameOver.winner;

  const title = finalWinner === "user" ? "YOU WIN 😁" : "YOU LOST 😔";
  const subtitle =
    finalWinner === "user"
      ? "Congrats! You won this round."
      : "Sorry, just try again.";

  useEffect(() => {
    if (finalWinner) {
      setShowGameOver(true); // show when game ends
    }

    if (finalWinner === "user" && !animationHasRun) {
      confettiAnimation(confetti);
      setAnimationHasRun(true);
    }
  }, [finalWinner, animationHasRun]);

  socket.on("goingToNewRound", () => {
    setWaitingText(true)
  });

  if (!showGameOver) return null; // Don’t render until game over
>>>>>>> f24306954684fce65c0df09a8e799635242b50a8

  return (
    <div className={style.game_over}>
      <div className={style.inner}>
        <img src={title === 'YOU WIN' ? win : lose} width={80} alt="" srcset="" />
        <p className={style.title}>{title}</p>
        <p>{subtitle}</p>
<<<<<<< HEAD
        <button
          onClick={playAgain}
          className={style.btn}
        >
          PLAY AGAIN
        </button>
        <button
          onClick={() => {
            window.location.href = `${API_BASE_URL}/home`;
          }}
          className={style.btn}
        >
          Exit Game
        </button>
=======
        <p>{(!waiting ? "Waiting for this round to finish" : "Going to next round in 5s")}</p>
>>>>>>> f24306954684fce65c0df09a8e799635242b50a8
      </div>
    </div>
  );
}

export default GameOver;

