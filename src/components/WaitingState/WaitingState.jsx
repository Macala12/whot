import React, { useEffect, useState } from "react";
import "../WaitingState/index.css";
import useIsGameOver from "../../utils/hooks/useIsGameOver";
import GameOver from "../GameOver/GameOver";

function WaitingState() {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isTimeUp, setIsTimeUp] = useState(false);

  // Get game over status from hook
  const { answer, winner } = useIsGameOver();

  // Format ms into mm:ss or hh:mm:ss 
  const formatTime = (ms) => {
    const hours = String(Math.floor((ms / (1000 * 60 * 60)) % 24)).padStart(2, "0");
    const minutes = String(Math.floor((ms / (1000 * 60)) % 60)).padStart(2, "0");
    const seconds = String(Math.floor((ms / 1000) % 60)).padStart(2, "0");
    return hours === "00" ? `${minutes}:${seconds}` : `${hours}:${minutes}:${seconds}`;
  };

  useEffect(() => {
    // Check if we already have an "endTime" in localStorage
    let endTime = localStorage.getItem("waitingEndTime");

    if (!endTime) {
      // If not, set it for 5 minutes from now
      endTime = Date.now() + 5 * 60 * 1000;
      localStorage.setItem("waitingEndTime", endTime);
    }

    const updateTime = () => {
      const diff = endTime - Date.now();
      if (diff <= 0) {
        setTimeLeft(0);
        setIsTimeUp(true);
        // localStorage.removeItem("waitingEndTime"); // reset for next round
      } else {
        setTimeLeft(diff);
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  // Instead of setAnswer/setWinner, just check isTimeUp
  if (isTimeUp) {
    sessionStorage.setItem("gameOver", "timedOut");
    return <GameOver winner={"user"} />;
  }

  return (
    <div className="waitingState">
      <p>
        Waiting for opponent to reconnect in{" "}
        {timeLeft !== null ? formatTime(timeLeft) : "Loading..."}
      </p>
    </div>
  );
}

export default WaitingState;
