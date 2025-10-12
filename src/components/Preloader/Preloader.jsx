import React, { useState, useEffect } from "react";
import style from "./index.module.css";
import CardComponent from "../CardComponent/CardComponent";
import game_music from "../../assets/sounds/game_music.mp3";

function Preloader() {
  const gameMusic = new Audio(game_music);
  const musicStorage = sessionStorage.getItem("sound");
  const [playMusic, showPlayMusic] = useState(true);

  useEffect(() => {
    if (musicStorage === "false") {
      showPlayMusic(false);
    }
  }, [])

  const playMusicAuto = () => {
    if (musicStorage) {
      if (musicStorage === true || musicStorage === "true") {
        gameMusic.loop = true;
        gameMusic.play();
        showPlayMusic(false)
      }
    } 
  }

  return (
    <div className={style.preloader}>
      <div className={style.animation_area}>
        <CardComponent isMine={false} isShown={false} />
      </div>
      <p>Setting up deck...</p>
{/* 
      {playMusic === true && (
        <button  onClick={playMusicAuto}>
          Click to play music
        </button>
      )}

      {playMusic !== true && (
        <button className="stopBtn" onClick={playMusicAuto}>
          Stop music
        </button>
      )} */}
    </div>
  );
}

export default Preloader;
