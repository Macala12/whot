import React from "react";
import style from "./index.module.css";
import { useSelector } from "react-redux";

function InfoText() {
<<<<<<< HEAD
  const [infoText, infoShown] = useSelector((state) => [
    state.infoText,
    state.infoShown,
  ]);
  const state = useSelector((state) => state); // get entire Redux state
  sessionStorage.setItem("gameInstances", JSON.stringify(state));
=======
  const infoText = useSelector((state) => state.infoText);
  const infoShown = useSelector((state) => state.infoShown);
>>>>>>> f24306954684fce65c0df09a8e799635242b50a8
  return (
    <p className={`${style.text} ${!infoShown && style.hidden}`}>{infoText}</p>
  );
}

export default InfoText;
