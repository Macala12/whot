import { useSelector } from "react-redux";
import { useEffect } from "react";

<<<<<<< HEAD
function useIsGameOver(value) {
  const is_gameOver = sessionStorage.getItem("is_gameOver");
    
  const [userCards, opponentCards] = useSelector((state) => [
    state.userCards,
    state.opponentCards,
  ]);

  const userCardTotal = userCards.reduce((acc, card) => acc + card.number, 0);
  const opponentCardsTotal = opponentCards.reduce((acc, card) => acc + card.number, 0);

  const isGameOver = () => {
    let answer = false;
    let winner = null;

    if (userCards.length === 0) {
      winner = "user";
      answer = true;
    } else if (opponentCards.length === 1) {
      winner = "opponent";
      answer = true;
    } else if (userCardTotal < opponentCardsTotal && is_gameOver) {
      winner = "user";
      answer = true;
    } else if (opponentCardsTotal < userCardTotal && is_gameOver) {
      winner = "opponent";
      answer = true;
    }else if (userCardTotal === opponentCardsTotal && is_gameOver) {
      winner = "draw";
      answer = true;
    }
    return { answer, winner };
  };
=======
function useIsGameOver() {
  const userCards = useSelector((state) => state.userCards);
  const opponentCards = useSelector((state) => state.opponentCards);


  let answer = false;
  let winner = null;
>>>>>>> f24306954684fce65c0df09a8e799635242b50a8

  if (userCards.length === 0) {
    winner = "user";
    answer = true;
    sessionStorage.setItem("gameOver", "normal");
  } else if (opponentCards.length === 0) {
    winner = "opponent";
    answer = true;
    sessionStorage.setItem("gameOver", "normal");
  }

  return { answer, winner };
}

export default useIsGameOver;
