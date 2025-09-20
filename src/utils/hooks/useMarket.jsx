import { useSelector, useDispatch } from "react-redux";
import { refreshUsedCards } from "../../redux/actions";
import { useEffect } from "react";

function useMarket() {
  const deck = useSelector((state) => state.deck);
  const usedCards = useSelector((state) => state.usedCards);
  const userCards = useSelector((state) => state.userCards);
  const opponentCards = useSelector((state) => state.opponentCards);
  const activeCard = useSelector((state) => state.activeCard);

  const dispatch = useDispatch();

  const market = deck.filter(
    (card) =>
      !usedCards.some(
        (usedCard) =>
          usedCard.shape === card.shape && usedCard.number === card.number
      )
  );

  useEffect(() => {
    if (market.length <= 10) {
      // Refresh market
      dispatch(refreshUsedCards([...userCards, ...opponentCards, activeCard]));
    }
  }, [activeCard, dispatch, market.length, opponentCards, usedCards]);

  return { market };
}

export default useMarket;
