import RoundOver from "../RoundOver/RoundOver"; 
import React, { useEffect, useState } from "react";
import socket from "../../socket/socket";

function RoundTimer() {
  const tournamentId = sessionStorage.getItem("tID");
  const room_id = sessionStorage.getItem("gameId");
  const [timeLeft, setTimeLeft] = useState(null);
  const [isTimeUp, setIsTimeUp] = useState(false);

  useEffect(() => {
    socket.emit("getRoundTime", { room_id: room_id, tournamentId: tournamentId });

     socket.on("roundTimer", ({ roundtime }) => {
      // roundtime should be a future timestamp (e.g., Date.now() + 7min)
      const now = Date.now();
      const diff = roundtime - now; // how much time is left
      setTimeLeft(diff > 0 ? diff : 0);
    });

    return () => socket.off("roundTimer");
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab is active again → resync timer        
        socket.emit("getRoundTime", { room_id: room_id, tournamentId: tournamentId });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [room_id]);

  // format ms into hh:mm:ss or mm:ss
  const formatTime = (ms) => {
    const minutes = String(Math.floor((ms / (1000 * 60)) % 60)).padStart(2, "0");
    const seconds = String(Math.floor((ms / 1000) % 60)).padStart(2, "0");
    const hours = Math.floor(ms / (1000 * 60 * 60));

    return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
  };

  useEffect(() => {
    if (timeLeft === null) return;

    if (timeLeft <= 0) {
      setIsTimeUp(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          clearInterval(timer);
          setIsTimeUp(true);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  if (isTimeUp) {
    socket.emit("roundOver");
    return <RoundOver />; // 👈 render your component when timer ends
  }

  return (
    <div className="timer">
      {timeLeft !== null ? <h6>{formatTime(timeLeft)}</h6> : <h6>Loading...</h6>}
    </div>
  );
}

export default RoundTimer;
