import React, { useEffect, useRef, useState } from "react";
import style from "./index.module.css";
import useIsGameOver from "../../utils/hooks/useIsGameOver";
import confetti from "canvas-confetti";
import confettiAnimation from "../../utils/functions/confettiAnimation";
import win from "../../assets/win.png";
import lose from "../../assets/lose.png";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";

function GameOver({ winner, timeOver }) {
  const API_BASE_URL = "http://localhost:3000";
  const { userid, gameid, key } = useParams();

  const gameOverState = useIsGameOver();
  const hasCalledEndGame = useRef(false);

  const [animationHasRun, setAnimationHasRun] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const userCards = useSelector((state) => state.userCards);
  const opponentCards = useSelector((state) => state.opponentCards);

  const userCardTotal = userCards.reduce((a, c) => a + c.number, 0);
  const opponentCardsTotal = opponentCards.reduce((a, c) => a + c.number, 0);

  /* ---------------- FINAL STATE ---------------- */
  const finalWinner = winner || gameOverState().winner;   

  const shouldShowGameOver = Boolean(winner || gameOverState().answer);

  let title = "";
  let subtitle = "";
  let state = "";

  /* ---------------- GAME RESULT ---------------- */
  if (winner) {
    sessionStorage.setItem("is_gameOver", true);

    if (winner === "user") {
      title = "YOU WIN";
      subtitle = "Congrats! You won this round.";
      state = "won";
    } else if (winner === "opponent") {
      title = "YOU LOST😔";
      subtitle = "Sorry, just try again.";
      state = "lost";
    } else {
      title = "YOU DREW";
      subtitle = "Congrats! You drew this round. Try again";
      state = "draw";
    }

    if (!animationHasRun) {
      confettiAnimation(confetti);
      setAnimationHasRun(true);
    }
  } else if (gameOverState().answer){
    if (gameOverState().answer) {
      sessionStorage.setItem("is_gameOver", true);
    }

    if (gameOverState().winner === "draw") {
      title = "YOU DREW";
      subtitle = "Congrats! You drew this round. Try again";
      state = "draw";
    } else {
      title =
        gameOverState().winner === "user" ? "YOU WIN" : "YOU LOST😔";
      subtitle =
        gameOverState().winner === "user"
          ? "Congrats! You won this round."
          : "Sorry, just try again.";
      state = gameOverState().winner === "user" ? "won" : "lost";
    }
  }

  /* ---------------- CONFETTI (HOOK END) ---------------- */
  useEffect(() => {
    if (gameOverState().winner === "user" && !animationHasRun) {
      confettiAnimation(confetti);
      setAnimationHasRun(true);
    }
  }, [gameOverState, animationHasRun]);

  /* ---------------- END GAME API ---------------- */
  useEffect(() => {
    if (!finalWinner) return;
    if (hasCalledEndGame.current) return;

    hasCalledEndGame.current = true;
    console.log("updated score");

    const endGame = async () => {
      const response = await fetch(`${API_BASE_URL}/end_game`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userid,
          id: gameid,
          userScore: userCardTotal,
          oppScore: opponentCardsTotal,
          fromGame: timeOver
        })
      });

      const result = await response.json();
      console.log(result);
      sessionStorage.clear();
    };

    endGame();
  }, []); // intentionally runs once

  /* ---------------- PLAY AGAIN ---------------- */
  const playAgain = async () => {
    if (isInitializing) return; // prevent double click

    setIsInitializing(true);
    const response = await fetch(`${API_BASE_URL}/new_game`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userid, id: gameid, key })
    });

    const result = await response.json();

    if (result.status) {
      sessionStorage.clear();
      window.location.href = `${result.url}/${result.payload.userid}/${result.payload.gameid}/${result.payload.gameKey}`;
    }
  };

  /* ---------------- RENDER ---------------- */
  return (
    <div
      className={`${style.game_over} ${
        !shouldShowGameOver && style.hidden
      }`}
    >
      <div className={style.inner}>
        <img
          src={title === "YOU WIN" ? win : lose}
          width={80}
          alt=""
        />

        <h4 className={style.title}>{title}</h4>
        <h5>{subtitle}</h5>

        {winner && (
          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "space-between",
              padding: "20px"
            }}
          >
            <div>
              <h4>Your Card</h4>
              <h4>{userCardTotal}</h4>
            </div>
            <div>
              <h4>Opponent Card</h4>
              <h4>{opponentCardsTotal}</h4>
            </div>
          </div>
        )}

        <button onClick={playAgain} className={style.btn} disabled={isInitializing}>
          {isInitializing ? "INITIALIZING..." : "PLAY AGAIN"}
        </button>

        <button
          onClick={() => (window.location.href = `${API_BASE_URL}/home`)}
          className={style.btn}
        >
          Exit Game
        </button>
      </div>
    </div>
  );
}

export default GameOver;
