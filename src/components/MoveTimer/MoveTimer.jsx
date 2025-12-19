import React, { useState, useEffect, useRef } from "react";
import "./index.css";
import GameOver from "../GameOver/GameOver";

function WastingTime({ time }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const timerRef = useRef(null);

  const formatTime = (ms) => {
    const minutes = String(Math.floor(ms / 60000)).padStart(2, "0");
    const seconds = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  useEffect(() => {
    if (!time || isTimeUp) return;

    const endTime = parseInt(time, 10);

    // clear previous interval
    if (timerRef.current) clearInterval(timerRef.current);

    const tick = () => {
      const gameOver = sessionStorage.getItem("is_gameOver");

      // 🔥 HARD STOP if game already ended elsewhere
      if (gameOver) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        return;
      }

      const diff = endTime - Date.now();

      if (diff <= 0) {
        setTimeLeft(0);
        setIsTimeUp(true);
        clearInterval(timerRef.current);
        timerRef.current = null;
      } else {
        setTimeLeft(diff);
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);

    return () => {
      clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [time, isTimeUp]);

  return (
    <div className="wasting-time">
      <p>
        You have{" "}
        {timeLeft !== null ? <b>{formatTime(timeLeft)}</b> : "00:00"} to play
        or you'll lose the game
      </p>

      {/* Only show if THIS timer caused the loss */}
      {isTimeUp && !sessionStorage.getItem("is_gameOver") && (
        <GameOver winner="opponent" type="timeOver"/>
      )}
    </div>
  );
}

export default WastingTime;
