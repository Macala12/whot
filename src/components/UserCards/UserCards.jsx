import React from "react";
import CardComponent from "../CardComponent/CardComponent";
import { useSelector } from "react-redux";
import CardNumber from "../CardNumber/CardNumber";

function UserCards({ payload }) {
  const [userCards] = useSelector((state) => [state.userCards]);

  const state = useSelector((state) => state); // get entire Redux state
  sessionStorage.setItem("gameInstances", JSON.stringify(state));

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
        <img
          src={
            payload.userimg ||
            "https://api.dicebear.com/9.x/big-smile/svg?seed=placeholder"
          }
          alt="User Avatar"
        />
        <div className="username">
          {payload.username} (You)
        </div>
      </div>
    </div>
  );
}

export default UserCards;
