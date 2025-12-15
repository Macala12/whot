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
import cardSound from "../../assets/sounds/card.mp3";
<<<<<<< HEAD
=======
import socket from "../../socket/socket";
>>>>>>> f24306954684fce65c0df09a8e799635242b50a8

function CardComponent({
  shape,
  number,
  isMine,
  isShown,
  isActiveCard,
  isPlayed,
  isMarketCard,
}) {
  const tournament_Id = sessionStorage.getItem("tID");
  const tournamentId = sessionStorage.getItem("gameId");
  const userid = localStorage.getItem("storedId");
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
    infoTextValues.computersTurn = "It's your opponent's turn to make a move now";
  }

  const marketConfig = {
    market,
    dispatch,
    usedCards,
    userCards,
    opponentCards,
  };

  let delay = 300;

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

  const currentState = store.getState(); 

  const sendSocket = (param) => {
    socket.emit("specialMoveCall", { room_id: tournamentId, tournamentId: tournament_Id, move: param, whoPlayed: userid });
  };

  const playCardSound = () => {
    const audio = new Audio(cardSound);
    audio.play().catch(() => {});
  };

  const handleClick = () => {
<<<<<<< HEAD
    playCardSound();
    if (isMarketCard && whoIsToPlay === "user") {
=======
    const cardSd = new Audio(cardSound);
    const currentTurn = currentState.whoIsToPlay;
    const currentActiveCard = currentState.activeCard;

    if (isMarketCard && currentTurn === "user") {
>>>>>>> f24306954684fce65c0df09a8e799635242b50a8
      goToMarket("user", marketConfig, 1);
      dispatch(setWhoIsToPlay("opponent"));
      dispatch(setInfoText(infoTextValues.computersTurn));
      return;
    }

    if (!isMine) return;

<<<<<<< HEAD
    if (whoIsToPlay === "user" && (number === activeCard.number || shape === activeCard.shape)) {
=======
    if (currentTurn === "user" && (number === currentActiveCard.number || shape === currentActiveCard.shape)) {
      
      cardSd.play();
>>>>>>> f24306954684fce65c0df09a8e799635242b50a8
      playUserCard();
    }

    if (number === 2 || number === "2") {
      sendSocket("pick_two");
    } else if (number === 5 || number === "5") {
      sendSocket("pick_three");
    } else if (number === 14 || number === "14") {
      sendSocket("general_market");
    } else if (number === 1 || number === "1") {
      sendSocket("hold_on");   
    } else if (number === 8 || number === "8") {
      sendSocket("suspension");   
    }

    if (userCards.length === 1) {
      sendSocket("last_card");   
    }


  };

  return (
    <>
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
    </>
  );
}

export default CardComponent;