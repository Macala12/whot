import React from "react";
import CardComponent from "../CardComponent/CardComponent";
import { useSelector } from "react-redux";

function Market() {
  const state = useSelector((state) => state); // get entire Redux state
  sessionStorage.setItem("gameInstances", JSON.stringify(state));
  return <CardComponent isMine={true} isShown={false} isMarketCard={true} />; 
}

export default Market;
