import React, { useEffect, useState } from "react";
import CardComponent from "../CardComponent/CardComponent";
import { useSelector } from "react-redux";
import CardNumber from "../CardNumber/CardNumber";
import socket from "../../socket/socket";

function UserCards() {
  const tournamentId = sessionStorage.getItem("tID");
  const username = localStorage.getItem("storedId");
  const room_id = sessionStorage.getItem("gameId")
  const userCards = useSelector((state) => state.userCards);
  const [playerData, setPlayerData] = useState({
    username: "",
    userImg: "",
  });

  // Get total sum of numbers from userCards
  // const totalValue = userCards.reduce((acc, card) => acc + card.number, 0);

  useEffect(() => {
    socket.on("playersData", (data) => {
      console.log("Hitting players Data");
      
      // Assuming this component is showing playerOne (you can adjust if it’s playerTwo)
      setPlayerData({
        username: data.playerOne.username,
        userImg: data.playerOne.userImg,
      });
    });

    socket.emit("getPlayersData", { room_id: room_id, tournamentId: tournamentId });

    // Cleanup listener
    return () => socket.off("playersData");
  }, []);

  let playerOneImg;
  if (playerData.username === username) {
    playerOneImg = playerData.userImg;
  }

  return (
    <div className="scroll-container">
      <div className="grid">
        {userCards.map((card) => (
          <CardComponent
            shape={card.shape}
            number={card.number}
            isMine={true}
            isShown={true}
            key={card.shape + card.number}
          />
        ))}
      </div>

      <CardNumber number={userCards.length} />

      <div className="user">
        {/* <img
          src={
            playerOneImg ||
            "https://api.dicebear.com/9.x/big-smile/svg?seed=placeholder"
          }
          alt="User Avatar"
        /> */}
        <div className="username">
          {username || "Loading..."} (You)
        </div>
      </div>
    </div>
  );
}

export default UserCards;
