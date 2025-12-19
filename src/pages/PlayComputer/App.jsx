import {
  UserCards,
  ComputerCards,
  CenterArea,
  InfoArea,
  GameOver,
  Preloader,
} from "../../components";
import RoundTimer from "../../components/RoundTimer/RoundTimer";
import MoveTimer from "../../components/MoveTimer/MoveTimer";
import UIPanlel from "../../components/UI_Panel/UI_Panel";
import usePreload from "../../utils/hooks/usePreload";
import { Flipper } from "react-flip-toolkit";
import { useSelector } from "react-redux";
import "../../index.css";
import { useState, useEffect, useRef } from "react";

function App() {
  const { loading, payload } = usePreload();
  const [waitTime, setWaitTime] = useState(null);
  const moveTimerStartedRef = useRef(false);

  const [activeCard, userCards, opponentCards, whoIsToPlay] = useSelector((state) => [
    state.activeCard,
    state.userCards,
    state.opponentCards,
    state.whoIsToPlay
  ]);

  useEffect(() => {
    if (whoIsToPlay === "user") {
      if (!moveTimerStartedRef.current) {
        const time = Date.now() + 15 * 1000;
        setWaitTime(time);
        moveTimerStartedRef.current = true;
      }
    } else {
      setWaitTime(null);
      moveTimerStartedRef.current = false; // reset for next turn
    }
  }, [whoIsToPlay]);

  if (loading || !payload || !payload.payload) return <Preloader />;
  
  return (
    <Flipper flipKey={[activeCard, ...userCards, ...opponentCards]}>
      <div className="App">
        <UIPanlel payload={payload.payload} />
        <RoundTimer timer={payload.payload.timer} />
        <ComputerCards payload={payload.payload} />
        <CenterArea />
        <UserCards payload={payload.payload} />
        <InfoArea />
        <GameOver />
        <MoveTimer time={waitTime}/>
        <Preloader />
      </div>
    </Flipper>
  );
}

export default App;
