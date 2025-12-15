import React, { useEffect, useState } from "react";
import useIsGameOver from "../../utils/hooks/useIsGameOver";
import GameOver from "../GameOver/GameOver";
import { useSelector } from "react-redux";


function RoundTimer({ timer }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [winner, setWinner] = useState(false);
  const isGameOver = sessionStorage.getItem("is_gameOver");

  const gameOver = useIsGameOver();
  const userCards = useSelector((state) => state.userCards);
  const opponentCards = useSelector((state) => state.opponentCards);

  const userCardTotal = userCards.reduce((acc, card) => acc + card.number, 0);
  const opponentCardsTotal = opponentCards.reduce((acc, card) => acc + card.number, 0);

  useEffect(() => {
    if (!timer) return;

    const now = Date.now();
    const diff = timer - now; // time remaining in ms

    setTimeLeft(diff > 0 ? diff : 0);
  }, [timer]);

  // Countdown effect
  useEffect(() => {
    if (timeLeft === null) return;
    if (isGameOver) return; 

    if (timeLeft <= 0) {
      setTimeLeft(0);
      if (userCardTotal < opponentCardsTotal) {
        setWinner("user");
      } else if (opponentCardsTotal < userCardTotal) {
        setWinner("opponent");
      } else {
        setWinner("draw");
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  // format ms into hh:mm:ss or mm:ss
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");

    return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
  };

  return (
    <div className="timer">
      <h6>
        {timeLeft === null ? "00:00" : formatTime(timeLeft)}
        {<p>To count card</p>}
        {winner && <GameOver winner={winner} />}
      </h6>
    </div>
  );
}

export default RoundTimer;
