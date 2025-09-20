import React, { useState, useEffect } from "react";
import style from "./index.module.css";
import Number from "../Number/Number";
import Shape from "../Shape/Shape";
import { useDispatch, useSelector, useStore } from "react-redux";
import { Flipped } from "react-flip-toolkit";
import useMarket from "../../utils/hooks/useMarket";
import goToMarket from "../../utils/functions/goToMarket";
import useIsGameOver from "../../utils/hooks/useIsGameOver";
import usePlayCardFunctions from "../../utils/hooks/usePlayCardFunctions";
import { setInfoText, setWhoIsToPlay } from "../../redux/actions";
import infoTextValues from "../../constants/infoTextValues";
import { useLocation } from "react-router-dom";

function CardComponent({
  shape,
  number,
  isMine,
  isShown,
  isActiveCard,
  isPlayed,
  isMarketCard,
}) {
  const [isShownState, setIsShownState] = useState(isShown);

  const activeCard = useSelector((state) => state.activeCard);
  const userCards = useSelector((state) => state.userCards);
  const usedCards = useSelector((state) => state.usedCards);
  const opponentCards = useSelector((state) => state.opponentCards);

  const dispatch = useDispatch();
  const store = useStore(); // 👈 we’ll use this for fresh state
  const { market } = useMarket();
  const isGameOver = useIsGameOver();
  const location = useLocation();

  if (location.pathname.includes("play-friend")) {
    infoTextValues.computersTurn =
      "It's your opponent's turn to make a move now";
  }

  const marketConfig = {
    market,
    dispatch,
    usedCards,
    userCards,
    opponentCards,
  };

  let delay = 500;

  const [playUserCard, playOpponentCard] = usePlayCardFunctions({
    shape,
    number,
    goToMarket,
    marketConfig,
    setIsShownState,
    delay,
  });

  useEffect(() => {
    if (!isPlayed) return;

    if (isGameOver().answer) return;

    setTimeout(() => {
      playOpponentCard();
    }, delay);
  }, [
    activeCard,
    userCards,
    opponentCards,
    delay,
    isGameOver,
    isPlayed,
    playOpponentCard,
  ]);

  const currentState = store.getState(); // 👈 always fresh
  console.log("This is the current turn ", currentState.whoIsToPlay);

  const handleClick = () => {
    // const currentState = store.getState(); // 👈 always fresh
    const currentTurn = currentState.whoIsToPlay;
    console.log("This is the current turn ", currentTurn);
    const currentActiveCard = currentState.activeCard;

    if (isMarketCard && currentTurn === "user") {
      goToMarket("user", marketConfig, 1);
      dispatch(setWhoIsToPlay("opponent"));
      dispatch(setInfoText(infoTextValues.computersTurn));
      console.log(currentTurn, " Just Played");
      return;
    }

    if (!isMine) return;

    if (currentTurn === "user" && (number === currentActiveCard.number || shape === currentActiveCard.shape)) {
      playUserCard();
    }
  };

  return (
    <Flipped flipId={shape + number}>
      <div
        className={`${style.card} ${isShownState && style.shown} ${
          isMine && style.mine
        } ${isActiveCard && "active-card"}`}
        onClick={handleClick}
      >
        <div className={style.inner}>
          <div className={style.front}>
            <Number number={number} shape={shape} />
            <Shape shape={shape} />
            <Number number={number} shape={shape} reverse={true} />
          </div>
          <div className={style.back}>
            <p>WHOT</p>
            <p>WHOT</p>
          </div>
        </div>
      </div>
    </Flipped>
  );
}

export default CardComponent;