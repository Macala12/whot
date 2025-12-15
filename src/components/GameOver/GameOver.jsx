import React from "react";
import style from "./index.module.css";
import useIsGameOver from "../../utils/hooks/useIsGameOver";
import confetti from "canvas-confetti";
import confettiAnimation from "../../utils/functions/confettiAnimation";
import win from "../../assets/win.png";
import lose from "../../assets/lose.png";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";

function GameOver({ winner }) {
  const API_BASE_URL = 'http://localhost:3000';
  const { userid, gameid, key } = useParams();
  const isGameOver = useIsGameOver();
  const [animationHasRun, setAnimationHasRun] = useState(false);

  const userCards = useSelector((state) => state.userCards);
  const opponentCards = useSelector((state) => state.opponentCards);

  const userCardTotal = userCards.reduce((acc, card) => acc + card.number, 0);
  const opponentCardsTotal = opponentCards.reduce((acc, card) => acc + card.number, 0);

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
            userScore: userCardTotal,
            oppScore: opponentCardsTotal
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

  return (
    <div
      className={`${style.game_over} ${!isGameOver().answer && style.hidden}`}
    >
      <div className={style.inner}>
        <img src={title === 'YOU WIN' ? win : lose} width={80} alt="" srcset="" />
        <p className={style.title}>{title}</p>
        <p>{subtitle}</p>
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
      </div>
    </div>
  );
}

export default GameOver;
