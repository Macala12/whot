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
import { useSelector, useDispatch, useStore } from "react-redux";
import { useEffect, useState } from "react";
import "../../index.css";
import { useParams } from "react-router-dom";
import socket from "../../socket/socket";
import { generateRandomCode } from "../../utils/functions/generateRandomCode";
import useIsGameOver from "../../utils/hooks/useIsGameOver";
import RoundTimer from "../../components/RoundTimer/RoundTimer";
import WaitingState from "../../components/WaitingState/WaitingState";
import PlaySound from "../../components/PlayMusic/PlayMusic";
import StopMusic from "../../components/StopMusic/StopMusic";
import CardEffect from "../../components/CardEffect/CardEffect";
import WastingTime from "../../components/WastingTIme/WastingTIme";
// import useTurnTimer from "../../utils/hooks/useTurnTime";

function App() {  
  sessionStorage.removeItem("gameOver");
  setTimeout(() => {
    reload();
  }, 2000);

  const reload = () => {
    const isReload = sessionStorage.getItem("shouldReload");
    if (!isReload) {
      sessionStorage.setItem("shouldReload", false);
      // reload code here
      window.location.reload();
    }else if (isReload === true || isReload === "true") {
      sessionStorage.setItem("shouldReload", false);
      //reload code here
      window.location.reload();
    }
  };
  
  const { room_id } = useParams();
  const usersname = localStorage.getItem("storedId");
  const tournamentId = sessionStorage.getItem("tID");
  const musicStorage = sessionStorage.getItem("sound");
  const [playMusic, showPlayMusic] = useState(false);

  useEffect(() => {
    if (!musicStorage) {
      showPlayMusic(true);
    }
  }, [musicStorage])

  const [effectType, setEffectType] = useState(null);
  const [trigger, setTrigger] = useState(false);
  const [whoPlayedFunc, setWhoPlayed] = useState("");
  const [isGameOver, setIsGameOver] = useState(false);
  const [realWinner, setWinner] = useState(null);

  function handleCardAction(type, whoPlayed) {
    setEffectType(type);
    setWhoPlayed(whoPlayed);
    setTrigger(!trigger); // toggles to retrigger animation
  }

  let room_id_2 = sessionStorage.getItem("gameId");

  if (room_id_2 !== room_id) {
    let newroomid = sessionStorage.setItem("gameId", room_id);
    room_id_2 = newroomid;
  }
  
  const [gameOver, setGameOver] = useState(sessionStorage.getItem("gameOver"));

  // useTurnTimer(room_id_2);

  // const isGameOver = useIsGameOver();
  const [errorText, setErrorText] = useState("");
  const [onlineState, setOnlineState] = useState({
    userIsOnline: false,
    opponentIsOnline: false,
  });
  const [showWaiting, setShowWaiting] = useState();
  const [showWastingTimer, setShowWastingTime] = useState(false);

  const activeCards = useSelector((state) => state.activeCard);
  const userCards = useSelector((state) => state.userCards);
  const opponentCards = useSelector((state) => state.opponentCards);
  const stateHasBeenInitialized = useSelector((state) => state.stateHasBeenInitialized);

  const dispatch = useDispatch();
  const store = useStore();
  const currentState = store.getState(); 

  useEffect(() => {
    const currentTurn = currentState.whoIsToPlay;
    if (currentTurn === "user") {
      setShowWastingTime(true);
    }else {
      setShowWastingTime(false);
      sessionStorage.removeItem("endTime");
    }
  }, [currentState]);

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
    };

    const handleUserOnlineState = (userIsOnline) => {
      setOnlineState((prevState) => ({ ...prevState, userIsOnline }));
    };

    const handleConfirmOnlineState = () => {
      socket.emit("confirmOnlineState", storedId, room_id_2, tournamentId);
    };

    const roundEnded = () => {
      setGameOver(true);
    };

    const specialMove = (move) => {
      const sMove = move.specialMove;
      const whoPlayed = move.whoPlayed;
      handleCardAction(`${sMove}`, whoPlayed);
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
    socket.on("specialMoveReceive", specialMove);
    socket.on("setWastedTime", ({ value, username }) => {        
        if (value === true || value === "true") {
          if (username === usersname) {
            setWinner("opponent");
          }else{
            setWinner("user");
          }
          sessionStorage.setItem("gameOver", "wastedTime");
          sessionStorage.setItem("wastedTime", username);
          setIsGameOver(true);
        }
    });

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

  useEffect(() => {
      const handleStorageChange = () => {
        const gameOverStatus = sessionStorage.getItem("gameOver");

        if (gameOverStatus) {
          setGameOver(true);
        }
      };

      // Run immediately on mount
      handleStorageChange();

      // Listen for storage changes (cross-tab)
      window.addEventListener("storage", handleStorageChange);

      return () => {
        window.removeEventListener("storage", handleStorageChange);
      };
  }, []);


  if (errorText) return <ErrorPage errorText={errorText} />;

  if (!stateHasBeenInitialized) {
    return <ConnectionLoader />;
  }

  return (
    <Flipper flipKey={[...userCards, ...opponentCards]}>
      <div className="App">
        {playMusic ? <PlaySound isSound={true} /> : <PlaySound isSound={false} />}
        <div>{showWaiting ? <WaitingState /> : <p></p>}</div>
        <RoundTimer />
        <OpponentCards />
        <CenterArea />
        <UserCards />
        <div>
          {showWaiting ? ("")  : gameOver ? ('') : showWastingTimer ? (<WastingTime />) : ("")}
        </div>
        <CardEffect type={effectType} whoPlayed={whoPlayedFunc} trigger={trigger} />
        <InfoArea />
        {isGameOver ? <GameOver winner={realWinner} /> : ""}
        <GameOver />
        <Preloader />
        <OnlineIndicators onlineState={onlineState} />
      </div>
    </Flipper>
  );
}

export default App;
