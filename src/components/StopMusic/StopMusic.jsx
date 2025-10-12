import React, { useState } from "react";
import "./index.css";
import game_music from "../../assets/sounds/game_music.mp3";

function StopMusic() {
  const gameMusic = new Audio(game_music);
  const musicStorage = sessionStorage.getItem("sound");

  const stopMusicAuto = () => {
    if (musicStorage) {
      if (musicStorage === true || musicStorage === "true") {
        gameMusic.pause();
      }
    } 
  }

  return (
    <div className="stop">
        <button onClick={stopMusicAuto}>
          Stop music
        </button>
    </div>
  );
}

export default StopMusic;
