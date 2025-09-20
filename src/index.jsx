import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { PlayComputer, Home, CopyLink, PlayFriend, PlayConnector, Leaderboard, TournamentOver } from "./pages";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" exact element={<Home />} />
        <Route path="/play-computer" exact element={<PlayComputer />} />
        <Route path="/copylink" exact element={<CopyLink />} />
        <Route path="/play-friend" exact element={<PlayFriend />} />
        <Route path="/play-friend/:room_id" exact element={<PlayFriend />} />
        <Route path="/play-connector/:storeId/:gameId" exact element={<PlayConnector />} />
        <Route path="/leaderboard/:gameId" exact element={<Leaderboard />} />
        <Route path="/tournamentOver/:tournamentid" exact element={<TournamentOver />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
