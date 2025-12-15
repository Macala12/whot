import { createStore } from "redux";
import combinedReducer from "./reducers";
import initializeDeck from "../utils/functions/initializeDeck";

// 1️⃣ Check if there is a saved state in sessionStorage
const savedState = JSON.parse(sessionStorage.getItem("gameInstances") || "null");

// 2️⃣ If no saved state, initialize deck as before
const defaultDeckState = initializeDeck();

// 3️⃣ Prepare the initial state
const initialState = savedState || {
  deck: defaultDeckState.deck,
  userCards: defaultDeckState.userCards,
  usedCards: defaultDeckState.usedCards,
  opponentCards: defaultDeckState.opponentCards,
  activeCard: defaultDeckState.activeCard,
  whoIsToPlay: "user",
  infoText: "It's your turn to make a move now",
  infoShown: true
};

// 4️⃣ Create the Redux store
const store = createStore(
  combinedReducer,
  initialState,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

// 5️⃣ Optional: Save to sessionStorage whenever state changes
store.subscribe(() => {
  const state = store.getState();
  sessionStorage.setItem("gameInstances", JSON.stringify(state));
});

export default store;
