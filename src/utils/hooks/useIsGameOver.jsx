import { useSelector } from "react-redux";

function useIsGameOver(value) {
  const is_gameOver = sessionStorage.getItem("is_gameOver");
    
  const [userCards, opponentCards] = useSelector((state) => [
    state.userCards,
    state.opponentCards,
  ]);

  const isGameOver = () => {
    let answer = false;
    let winner = null;

    if (userCards.length === 0) {
      winner = "user";
      answer = true;
    } else if (opponentCards.length === 0) {
      winner = "opponent";
      answer = true;
    }
    return { answer, winner };
  };

  return isGameOver;
}

export default useIsGameOver;
