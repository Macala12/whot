import React from "react";
import CardComponent from "../CardComponent/CardComponent";
import { useSelector, useDispatch } from "react-redux";
import useMarket from "../../utils/hooks/useMarket";
import { useEffect } from "react";
import goToMarket from "../../utils/functions/goToMarket";
import useIsGameOver from "../../utils/hooks/useIsGameOver";
import { setInfoText, setWhoIsToPlay } from "../../redux/actions";
import infoTextValues from "../../constants/infoTextValues";

function ComputerCards({ payload }) {
  const [opponentCards, whoIsToPlay, activeCard, usedCards, userCards] =
    useSelector((state) => [
      state.opponentCards,
      state.whoIsToPlay,
      state.activeCard,
      state.usedCards,
      state.userCards,
    ]);

  const dispatch = useDispatch();
  const { market } = useMarket();

  const marketConfig = {
    market,
    dispatch,
    usedCards,
    userCards,
    opponentCards,
    activeCard,
  };

  const isGameOver = useIsGameOver();

  let cardArray = [];
  let isPlayed = false;
  let isPlayedSet = false;
  // I'm using isPlayedSet to make sure isPlayed is only true for one card
  opponentCards.forEach((card) => {
    if (!isPlayedSet) {
      isPlayed =
        whoIsToPlay === "opponent" &&
        (card.number === activeCard.number || card.shape === activeCard.shape);
    } else {
      isPlayed = false;
    }

    if (isPlayed) {
      isPlayedSet = true;
    }

    cardArray.push(
      <CardComponent
        shape={card.shape}
        number={card.number}
        isMine={false}
        isShown={false}
        key={card.shape + card.number}
        isPlayed={isPlayed}
      />
    );
  });

  useEffect(() => {
    if (isPlayedSet === false && whoIsToPlay === "opponent") {
      if (isGameOver().answer) return;

      let delay = 500;
      setTimeout(() => {
        goToMarket("opponent", marketConfig);
        dispatch(setWhoIsToPlay("user"));
        dispatch(setInfoText(infoTextValues.usersTurn));
      }, delay);
    }
  }, [whoIsToPlay, userCards, opponentCards]);

  const state = useSelector((state) => state); // get entire Redux state
  sessionStorage.setItem("gameInstances", JSON.stringify(state));

  return (
    <div className="scroll-container">
      <div className="user user-opponent">
        <img
          src={
            `https://api.dicebear.com/9.x/big-smile/svg?seed=${payload.oppUsername}&radius=50&backgroundType=gradientLinear&randomizeIds=true&skinColor=643d19,8c5a2b,a47539,c99c62&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
          }
          alt="User Avatar"
        />
        <div className="username">
          {payload.oppUsername}
        </div>
      </div>
      <div className="grid">{cardArray}</div>
    </div>
  );
}

export default ComputerCards;
