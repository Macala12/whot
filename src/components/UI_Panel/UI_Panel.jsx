import React, { useEffect, useState } from "react";
import socket from "../../socket/socket";
import octacoin from "../../assets/logo.png";
import cash from "../../assets/dollars.png";

function UiPanel({payload}) {
  return (
        <div className="ui_panels">
            <div class="octacoin">
                <img src={octacoin} width="20px" alt="coin" />
                {payload.wagerOctacoin}
            </div>
            <div class="value_balance">
                <img src={cash} width="20px" alt="coin" />
                {'N'+payload.reward}
            </div>
        </div>
  );
}

export default UiPanel;