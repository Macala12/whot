import React, { useState } from "react";
import "../PlayMusic/index.css";
import game_music from "../../assets/sounds/game_music.mp3";

function PlaySound({isSound}) {
    const gameMusic = new Audio(game_music);
    const [playBox, showPlayBox] = useState(true);

    const play = (playBoolean) => {
        const shouldPlay = playBoolean === true || playBoolean === "true";
        sessionStorage.setItem("sound", shouldPlay);

        if (shouldPlay === true || shouldPlay === "true") {
            gameMusic.loop = true;
            gameMusic.play();
        }

        showPlayBox(false);
    };

    const noplay = (playBoolean) => {
        const shouldPlay = playBoolean === false || playBoolean === "false";
        sessionStorage.setItem("sound", shouldPlay);

        if (shouldPlay === false || shouldPlay === "false") {
            gameMusic.pause();
        }
    };

    return (
        <>  
            {isSound ?
                <>
                {playBox == true && (
                    <section className="music">
                        <div className="music__container">
                            <header className="music__header">
                            <h2 className="music__title">Play Music</h2>
                            </header>

                            <button className="btn play-sound" onClick={() => play("true")}>
                            🎵 Yes, Play
                            </button>

                            <button className="btn no-sound" onClick={() => play("false")}>
                            🔇 No, Don't Play
                            </button>
                        </div>
                    </section>
                )}
                </> : 
                <>
                    <button className="btn no-sound-main" onClick={() => noplay("false")}>
                        🔇 No, Music
                    </button>
                </>
            }

        </>
    );
}

export default PlaySound;
