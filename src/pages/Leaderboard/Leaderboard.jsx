import React, { useEffect, useState } from "react";
import "../Leaderboard/index.css";
import socket from "../../socket/socket";
import logo from "../../assets/logo.png"
import { useNavigate, useParams } from "react-router-dom";

function Leaderboard() {
  const username = localStorage.getItem("storedId");
  const { gameId } = useParams();
  const tournamentId = "68a64d526223e4d5e74daaea";
  const navigate = useNavigate();

  const [timeLeft, setTimeLeft] = useState(null);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [round, setRound] = useState();


  // format ms into hh:mm:ss or mm:ss
  const formatTime = (ms) => {
    const minutes = String(Math.floor((ms / (1000 * 60)) % 60)).padStart(2, "0");
    const seconds = String(Math.floor((ms / 1000) % 60)).padStart(2, "0");
    const hours = Math.floor(ms / (1000 * 60 * 60));

    return hours > 0
      ? `${hours}:${minutes}:${seconds}`
      : `${minutes}:${seconds}`;
  };

  useEffect(() => {
    socket.emit("next_round_timer", { gameId: gameId, tournamentId: tournamentId });

    socket.on("nextRoundTime", (nextRoundTime) => {
      const now = Date.now();
      const diff = nextRoundTime.nextRoundTime - now;
      setTimeLeft(diff > 0 ? diff : 0);
      setLeaderboard(nextRoundTime.leaderboard || []);
      setRound(nextRoundTime.ROUNDS_LEFT)
    });

    return () => {
      socket.off("nextRoundTime");
    };
  }, [gameId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab is active again → resync timer
        console.log("back to screen");
        
        socket.emit("next_round_timer", { gameId });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [gameId]);

  // Countdown timer
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

  // Redirect when time is up
  useEffect(() => {
    if (isTimeUp) {
      console.log("going to player ready");
      let room_id = gameId;
      
      socket.emit("player_ready", { room_id: room_id, username: username, tournamentId: tournamentId });
    }
  }, [isTimeUp, username, gameId]);

  useEffect(() => {
    let room_id = gameId;
    
    socket.on("start_new_round", (data) => {
      const { assignments, tournamentId } = data || {};
      if (!assignments) return;

      // assignments is { usernameA: roomIdA, usernameB: roomIdB }
      const assignedRoom = assignments[username];

      if (assignedRoom) {
        navigate(`/play-connector/${username}/${assignedRoom}`);
      } else {
        // fallback if no assignment found
        console.warn("No new room assigned for", username, "payload:", data);
      }
    });

  }, [navigate, username, gameId])

  return (
    <div className="leaderboard">
      <div className="logo">
        <img src={logo} className="logo-img" alt="" />
      </div>
      <h3>Whot Leaderboard</h3>
      <p>Track the top players, their scores, and progress across all rounds of the Whot game. The leaderboard updates in real time to highlight who’s leading each match.</p>

      <h3 className="roundTimer">
        {timeLeft !== null ? (
          <h6>{formatTime(timeLeft)}</h6>
        ) : (
          <h6>Loading...</h6>
        )}
      </h3>
      <p>to next round</p>
      <p>
        Remaining Rounds: <b>{round}</b>
      </p>

      <section className="leaderboard_main">
        <div className="_leaderboard">
          <h5 className="_header text-white ml-2 w-100">
            Leaderboard
            <span className="float-right mr-2" id="refreshingStatus"></span>
          </h5>
          <div className="_leaderboard_box table-responsive w-100">
            <table className="table table-borderless" id="leaderboardTable">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Username</th>
                  <th>Score</th>
                  <th>Prize</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length > 0 ? (
                  leaderboard.map((player, index) => (
                    <tr key={player.username || index}>
                      <td>{index + 1}</td>
                      <td className="d-flex align-items-center">
                        <img
                          src={player.userImg}
                          className="img-fluid mr-1"
                          alt={player.username}
                          width="20px"
                        />
                        {player.username}
                      </td>
                      <td>{player.score}</td>
                      <td>{player.prize || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">No players yet...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Leaderboard;
