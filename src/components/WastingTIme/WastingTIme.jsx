import React, { useState, useEffect } from "react";
import "./index.css";
import useIsGameOver from "../../utils/hooks/useIsGameOver";
import GameOver from "../GameOver/GameOver";
import socket from "../../socket/socket";

function WastingTime({ type }) {
  const tournamentId = sessionStorage.getItem("tID");
  const username = localStorage.getItem("storedId");
  const [timeLeft, setTimeLeft] = useState(null);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const gameover = sessionStorage.getItem("gameOver");
  const room_id = sessionStorage.getItem("gameId");

  const { answer, winner } = useIsGameOver();

  const formatTime = (ms) => {
    const minutes = String(Math.floor((ms / (1000 * 60)) % 60)).padStart(2, "0");
    const seconds = String(Math.floor((ms / 1000) % 60)).padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  useEffect(() => {
    if (gameover) return;

    // ⏱ Initialize or restore countdown
    let endTime = sessionStorage.getItem("endTime");

    if (!endTime) {
      const countdownDuration = 1 * 60 * 1000; // 15 minutes
      endTime = Date.now() + countdownDuration;
      sessionStorage.setItem("endTime", endTime);
    } else {
      endTime = parseInt(endTime, 10);
    }

    const updateTime = () => {
      const diff = endTime - Date.now();

      if (diff <= 0) {
        setTimeLeft(0);
        setIsTimeUp(true);
        clearInterval(timer);
      } else {
        setTimeLeft(diff);
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [gameover]);

  useEffect(() => {
    if (isTimeUp) {
      socket.emit("wastedTime", {
        room_id,
        tournamentId,
        username,
      });
      sessionStorage.removeItem("endTime"); // clear so next game starts fresh
    }
  }, [isTimeUp]);

  return (
    <div className="wasting-time">
      <p>
        You have{" "}
        {timeLeft !== null ? <b>{formatTime(timeLeft)}s</b> : "..."}{" "}
        to play or you'll lose the game
      </p>
    </div>
  );
}

export default WastingTime;
