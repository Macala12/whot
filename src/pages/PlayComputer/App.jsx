import {
  UserCards,
  ComputerCards,
  CenterArea,
  InfoArea,
  GameOver,
  Preloader,
} from "../../components";
import { Flipper } from "react-flip-toolkit";
import { useSelector } from "react-redux";
import "../../index.css";
import RoundTimer from "../../components/RoundTimer/RoundTimer";
import RoundOver from "../../components/RoundOver/RoundOver";

function App() {
  const [activeCard, userCards, opponentCards] = useSelector((state) => [
    state.activeCard,
    state.userCards,
    state.opponentCards,
  ]);

  return (
    <Flipper flipKey={[activeCard, ...userCards, ...opponentCards]}>
      <div className="App">
        <RoundOver />
        <InfoArea />
        <RoundTimer />
        <ComputerCards />
        <CenterArea />
        <UserCards />
        <GameOver />
        <Preloader />
      </div>
    </Flipper>
  );
}

export default App;
