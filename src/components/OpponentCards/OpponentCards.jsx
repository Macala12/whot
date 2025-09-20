import React, { useEffect, useState } from "react";
import CardComponent from "../CardComponent/CardComponent";
import { useSelector } from "react-redux";
import socket from "../../socket/socket";


function OpponentCards() {
  const tournamentId = "68a64d526223e4d5e74daaea";
  const username = localStorage.getItem("storedId");
  const room_id = sessionStorage.getItem("gameId")
  const opponentCards = useSelector((state) => state.opponentCards);
  const [playerData, setPlayerData] = useState({
    usernameTwo: "",
    userImgTwo: "",
    usernameOne: "",
    userImgOne: ""
  });

  useEffect(() => {
    socket.on("playersData", (data) => {
      // Assuming this component is showing playerOne (you can adjust if it’s playerTwo)
      setPlayerData({
        usernameTwo: data.playerTwo.username,
        userImgTwo: data.playerTwo.userImg,
        usernameOne: data.playerOne.username,
        userImgOne: data.playerOne.userImg 
      });
      console.log(data);
      
    });

    socket.emit("getPlayersData", { room_id: room_id, tournamentId: tournamentId });

    // Cleanup listener
    return () => socket.off("playersData");
  }, []);

  let opponentUsername, opponentUserImg
  if (playerData.usernameOne === username) {
    opponentUserImg = playerData.userImgTwo;
    opponentUsername = playerData.usernameTwo;
  }else {
    opponentUserImg = playerData.userImgOne;
    opponentUsername = playerData.usernameOne;
  }

  return (
    <div className="scroll-container">
      <div className="user user-opponent">
        <img
          src={
            opponentUserImg ||
            "https://api.dicebear.com/9.x/big-smile/svg?seed=placeholder"
          }
          alt="User Avatar"
        />
        <div className="username">
          {opponentUsername || "Loading..."}
        </div>
      </div>
      
      <div className="grid">
        {opponentCards.map((card) => (
          <CardComponent
            shape={card.shape}
            number={card.number}
            isMine={false}
            isShown={false}
            key={card.shape + card.number}
          />
        ))}
      </div>
    </div>
  );
}

export default OpponentCards;
