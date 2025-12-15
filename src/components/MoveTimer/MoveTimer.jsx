import React, { useState, useEffect, useRef } from "react";
import "./index.css";
import GameOver from "../GameOver/GameOver";

function WastingTime({ time }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const timerRef = useRef(null);

  // format ms into mm:ss
  const formatTime = (ms) => {
    const minutes = String(Math.floor((ms / (1000 * 60)) % 60)).padStart(2, "0");
    const seconds = String(Math.floor((ms / 1000) % 60)).padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  useEffect(() => {  
    const gameover = sessionStorage.getItem("is_gameOver");
    if (!time || time === "" || isTimeUp) return;
    if (gameover) return;

    // parse the time prop
    let endTime = parseInt(time, 10);

    // clear any previous interval
    if (timerRef.current) clearInterval(timerRef.current);

    const updateTime = () => {
      const diff = endTime - Date.now();

      if (diff <= 0) {
        setTimeLeft(0);
        setIsTimeUp(true);
        clearInterval(timerRef.current);
      } else {
        setTimeLeft(diff);
      }
    };

    updateTime();
    timerRef.current = setInterval(updateTime, 1000);

    return () => clearInterval(timerRef.current);
  }, [time, isTimeUp]);

  useEffect(() => {
    if (isTimeUp) {
      sessionStorage.removeItem("endTime");
    }
  }, [isTimeUp]);

  return (
    <div className="wasting-time">
      <p>
        You have{" "}
        {timeLeft !== null ? <b>{formatTime(timeLeft)}</b> : "00:00"} to play
        or you'll lose the game
      </p>
      {isTimeUp && <GameOver winner={"opponent"} />}
    </div>
  );
}

export default WastingTime;
