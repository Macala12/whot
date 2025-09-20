import React from "react";
import style from "./index.module.css";
import { useSelector } from "react-redux";

function InfoText() {
  const infoText = useSelector((state) => state.infoText);
  const infoShown = useSelector((state) => state.infoShown);
  return (
    <p className={`${style.text} ${!infoShown && style.hidden}`}>{infoText}</p>
  );
}

export default InfoText;
