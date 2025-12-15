import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setWhoIsToPlay, setInfoText } from "../../redux/actions";
import infoTextValues from "../../constants/infoTextValues";
import socket from "../../socket/socket"; // make sure your socket instance is imported

function useTurnTimer(room_id) {
  const dispatch = useDispatch();
  const currentPlayer = useSelector((state) => state.whoIsToPlay);
  const fullState = useSelector((state) => state); // grab the whole game state
  const timerRef = useRef(null);

  useEffect(() => {
    if (!currentPlayer) return;

    // Clear old timer
    clearTimeout(timerRef.current);

    // Start new 10s timer
    timerRef.current = setTimeout(() => {
      const nextPlayer = currentPlayer === "user" ? "opponent" : "user";

      // update local Redux
      dispatch(setWhoIsToPlay(nextPlayer));
      dispatch(
        setInfoText(
          nextPlayer === "user"
            ? infoTextValues.usersTurn
            : infoTextValues.computersTurn
        )
      );

      // build updated state with changes
      const updatedState = {
        ...fullState,
        whoIsToPlay: nextPlayer,
        infoText:
          nextPlayer === "user"
            ? infoTextValues.usersTurn
            : infoTextValues.computersTurn,
      };

      // send to backend so opponent sees the change too
      socket.emit("sendUpdatedState", updatedState, room_id);
    }, 10000);

    return () => clearTimeout(timerRef.current);
  }, [currentPlayer, dispatch, fullState, room_id]);

  return null; // hook doesn’t render anything
}

export default useTurnTimer;
