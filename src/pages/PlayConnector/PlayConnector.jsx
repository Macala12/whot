import "../PlayConnector/index.css";
import { ErrorPage } from "../../components";
import { useSearchParams, useNavigate } from "react-router-dom";
import socket from "../../socket/socket";
import React, { useEffect, useState } from "react";

function PlayConnector() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const storeId = searchParams.get("player");
  const gameId = searchParams.get("roomId");
  const tournamentId = searchParams.get("id");

  // const { storeId, gameId, tournamentId } = useParams();

  const [errorText, setErrorText] = useState("");
  const [timerText, setTimerText] = useState("Connecting...");

  // ✅ Save IDs & send to socket
  useEffect(() => {
    if (storeId && gameId) {
      localStorage.setItem("storedId", storeId);
      sessionStorage.setItem("gameId", gameId);
      sessionStorage.setItem("tID", tournamentId);      
      socket.emit("send_id", { id: storeId, tournamentId: tournamentId });
    }
  }, [storeId, gameId]);

  // ✅ Handle errors
  useEffect(() => {
    const handleError = (msg) => setErrorText(msg);

    socket.on("error", handleError);
    return () => socket.off("error", handleError);
  }, []);

  // ✅ Handle match joining
  useEffect(() => {
    const handleMatch = ({ room_id }) => {
      if (room_id) {
        let countdown = 3; // seconds
        setTimerText(`Joining in ${countdown}s`);

        const interval = setInterval(() => {
          countdown -= 1;
          if (countdown > 0) {
            setTimerText(`Joining in ${countdown}s`);
          } else {
            clearInterval(interval);
            navigate(`/play-friend/${room_id}`);
          }
        }, 1000);
      }
    };

    socket.on("get_match_id", handleMatch);
    return () => socket.off("get_match_id", handleMatch);
  }, [navigate]);

  if (errorText) return <ErrorPage errorText={errorText} />;

  return (
    <div className="play_connector">
      <p>{timerText}</p>
    </div>
  );
}

export default PlayConnector;
