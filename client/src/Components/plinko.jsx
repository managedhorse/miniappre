import React, { useEffect, useRef } from "react";
import { useUser } from "../context/userContext"; // adjust path as needed

function PlinkoIframePage() {
  const { balance, refBonus, id, loading, initialized } = useUser();
  const userIsReady = Boolean(id && initialized && !loading);
  const totalBalance = balance + refBonus;

  const iframeRef = useRef(null);

  useEffect(() => {
    if (!userIsReady) return;

    const iframe = iframeRef.current;
    if (!iframe) return;

    const sendUserDataToIframe = () => {
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          {
            type: "SET_USER_INFO",
            userId: id,
            totalBalance: totalBalance,
          },
          "https://plinko-game-main-two.vercel.app" // target origin of the iframe
        );
        console.log("Sent user info to iframe:", { userId: id, totalBalance });
      }
    };

    // Send data when the iframe loads
    iframe.addEventListener("load", sendUserDataToIframe);

    // Also send data immediately in case the iframe is already loaded
    sendUserDataToIframe();

    return () => {
      iframe.removeEventListener("load", sendUserDataToIframe);
    };
  }, [userIsReady, id, totalBalance]);

  if (!userIsReady) {
    return <div>Loading...</div>;
  }

  return (
    <iframe
      ref={iframeRef}
      src="https://plinko-game-main-two.vercel.app/"
      title="Plinko Game"
      style={{ width: "100%", height: "100vh", border: "none" }}
    ></iframe>
  );
}

export default PlinkoIframePage;