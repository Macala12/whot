import React, { useEffect, useState } from "react";
import style from "./index.module.css";
import useIsGameOver from "../../utils/hooks/useIsGameOver";
import confetti from "canvas-confetti";
import confettiAnimation from "../../utils/functions/confettiAnimation";
import socket from "../../socket/socket";

function GameOver({ winner }) {
  const isGameOver = useIsGameOver();
  const [animationHasRun, setAnimationHasRun] = useState(false);
  const [waiting, setWaitingText] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false); // <-- NEW STATE

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

  return (
    <div className={style.game_over}>
      <div className={style.inner}>
        <p className={style.title}>{title}</p>
        <p>{subtitle}</p>
        <p>{(!waiting ? "Waiting for this round to finish" : "Going to next round in 5s")}</p>
      </div>
    </div>
  );
}

export default GameOver;

