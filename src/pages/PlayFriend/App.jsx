import {
  UserCards,
  OpponentCards,
  CenterArea,
  InfoArea,
  GameOver,
  Preloader,
  ErrorPage,
  OnlineIndicators,
  ConnectionLoader
} from "../../components";
import { Flipper } from "react-flip-toolkit";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import "../../index.css";
import { useParams } from "react-router-dom";
import socket from "../../socket/socket";
import { generateRandomCode } from "../../utils/functions/generateRandomCode";
import useIsGameOver from "../../utils/hooks/useIsGameOver";
import RoundTimer from "../../components/RoundTimer/RoundTimer";
import WaitingState from "../../components/WaitingState/WaitingState";
// import useTurnTimer from "../../utils/hooks/useTurnTime";

function App() {  
  const { room_id } = useParams();
  const tournamentId = "68a64d526223e4d5e74daaea";
  let room_id_2 = sessionStorage.getItem("gameId");

  if (room_id_2 !== room_id) {
    let newroomid = sessionStorage.setItem("gameId", room_id);
    room_id_2 = newroomid;
  }
  
  const [gameOver, setGameOver] = useState(false)

  // useTurnTimer(room_id_2);

  // const isGameOver = useIsGameOver();
  const [errorText, setErrorText] = useState("");
  const [onlineState, setOnlineState] = useState({
    userIsOnline: false,
    opponentIsOnline: false,
  });
  const [showWaiting, setShowWaiting] = useState(false);

  const activeCards = useSelector((state) => state.activeCard);
  const userCards = useSelector((state) => state.userCards);
  const opponentCards = useSelector((state) => state.opponentCards);
  const stateHasBeenInitialized = useSelector((state) => state.stateHasBeenInitialized);

  const dispatch = useDispatch();

  useEffect(() => {
    let storedId = localStorage.getItem("storedId");

    if (!storedId) {
      storedId = generateRandomCode(10);
      localStorage.setItem("storedId", storedId);
    }

    const handleDispatch = (action) => {
      action.isFromServer = true;
      dispatch(action);
    };

    const handleWrongRoom = (roomid) => {
      socket.emit("join_room", { room_id: roomid, storedId: storedId, tournamentId: tournamentId });
    };

    const handleError = (errorText) => {
      setErrorText(errorText);
    };

    const handleDisconnect = () => {
      setOnlineState((prevState) => ({ ...prevState, userIsOnline: false }));
    };

    const handleConnect = () => {
      setOnlineState((prevState) => ({ ...prevState, userIsOnline: true }));
    };

    const handleOpponentOnlineState = (opponentIsOnline) => {
      setOnlineState((prevState) => ({ ...prevState, opponentIsOnline }));
      console.log("this ran");
    };

    const handleUserOnlineState = (userIsOnline) => {
      setOnlineState((prevState) => ({ ...prevState, userIsOnline }));
      console.log("this ran");
    };

    const handleConfirmOnlineState = () => {
      socket.emit("confirmOnlineState", storedId, room_id_2, tournamentId);
    };

    const roundEnded = () => {
      setGameOver(true);
    };

    socket.emit("join_room", { room_id: room_id, storedId: storedId, tournamentId: tournamentId });
    socket.on("wrongRoomCorrection", ({actual_match_id}) => {
      handleWrongRoom(actual_match_id);
    });
    socket.on("dispatch", handleDispatch);
    socket.on("error", handleError);
    socket.on("disconnect", handleDisconnect);
    socket.on("connected", handleConnect);
    socket.on("opponentOnlineStateChanged", handleOpponentOnlineState);
    socket.on("userOnlineStateChanged", handleUserOnlineState);
    socket.on("confirmOnlineState", handleConfirmOnlineState);
    socket.on("roundEnded", roundEnded);

    return () => {
      socket.off("dispatch", handleDispatch);
      socket.off("error", handleError);
      socket.off("disconnect", handleDisconnect);
      socket.off("connected", handleConnect);
      socket.off("opponentOnlineStateChanged", handleOpponentOnlineState);
      socket.off("userOnlineStateChanged", handleUserOnlineState)
      socket.off("confirmOnlineState", handleConfirmOnlineState);
    };
  }, [dispatch, room_id, room_id_2, tournamentId]);

  useEffect(() => {    
    if (onlineState.opponentIsOnline === false) {
      setShowWaiting(true);
    }else{
      localStorage.removeItem("waitingEndTime");
      setShowWaiting(false);
    }
  }, [onlineState.opponentIsOnline]);

  useEffect(() => {
    if (sessionStorage.getItem("gameOver") === "normal") {
      setShowWaiting(false);
    }
  })

  if (errorText) return <ErrorPage errorText={errorText} />;

  if (!stateHasBeenInitialized) {
    return <ConnectionLoader />;
  }

  return (
    <Flipper flipKey={[...userCards, ...opponentCards]}>
      <div className="App">
        <div>{showWaiting ? <WaitingState /> : <p></p>}</div>
        <RoundTimer />
        <OpponentCards />
        <CenterArea />
        <UserCards />
        <InfoArea />
        <GameOver />
        <Preloader />
        <OnlineIndicators onlineState={onlineState} />
      </div>
    </Flipper>
  );
}

export default App;
