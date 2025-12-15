import React, { useState, useEffect } from "react";
import "./index.css";

const EFFECT_TEXTS = {
  pick_two: "PICK TWO!",
  pick_three: "PICK THREE!",
  hold_on: "HOLD ON!",
  suspension: "SUSPENSION",
  general_market: "GENERAL MARKET!",
  last_card: "LAST CARD!",
};

function CardEffect({ type, trigger }) {
  const [visible, setVisible] = useState(false);
  const [animation, showAnimation] = useState(false);

  useEffect(() => {    
    if (!type) return;
    
    // Show the effect
    setVisible(true);
    showAnimation(true);
    
    console.warn('visible; ', visible);

    // Hide after 2 seconds (adjust if needed)
    const timer = setTimeout(() => {
      setVisible(false);
      showAnimation(false);
    }, 3000);
    // Cleanup in case trigger changes
    return () => clearTimeout(timer);
  }, [trigger, type]);

  // if (!visible) return null;

  return (
  <div className={`card-effect ${animation ? "animation" : ""}`}>
    <p>{EFFECT_TEXTS[type]}</p>
  </div>
  );
}

export default CardEffect;
