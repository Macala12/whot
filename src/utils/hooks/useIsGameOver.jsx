import { useSelector } from "react-redux";
import { useEffect } from "react";

function useIsGameOver() {
  const userCards = useSelector((state) => state.userCards);
  const opponentCards = useSelector((state) => state.opponentCards);


  let answer = false;
  let winner = null;

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
