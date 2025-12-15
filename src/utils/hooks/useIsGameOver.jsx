import { useSelector } from "react-redux";

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

  return isGameOver;
}

export default useIsGameOver;
