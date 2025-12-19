import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function usePreload() {
  const API_BASE_URL = 'https://octagames.ng';
  const { userid, gameid, key } = useParams();
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/initialize_game?id=${gameid}&userid=${userid}&key=${key}`
        );
        const result = await response.json();  
        if (!result.payload.status) {
          window.location.href = `${API_BASE_URL}/404`;
        }      
        setPayload(result);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userid, gameid]);

  return { loading, payload };
}

export default usePreload;
