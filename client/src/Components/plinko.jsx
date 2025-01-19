// PlinkoIframePage.jsx
import React, { useEffect, useRef } from "react";
import { useUser } from "../context/userContext";

function PlinkoIframePage() {
  const { balance, id, loading, initialized, createPlinkoSession, endPlinkoSession } = useUser();
  const userIsReady = Boolean(id && initialized && !loading);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!userIsReady) return;
    const iframe = iframeRef.current;
    if (!iframe) return;

    let sessionId = null;

    async function startSession() {
      try {
        // 1) Create session in Firestore via userContext
        sessionId = await createPlinkoSession();

        // 2) Post INIT_SESSION to the iframe
        iframe.contentWindow?.postMessage(
          {
            type: "INIT_SESSION",
            userId: id,
            sessionBalance: balance, // local state
            sessionId,
          },
          "https://plinko-game-main-two.vercel.app"
        );
        console.log("Sent INIT_SESSION to iframe with sessionId =", sessionId);
      } catch (err) {
        console.error("Error starting plinko session:", err);
      }
    }

    function onIframeLoad() {
      startSession();
    }
    iframe.addEventListener("load", onIframeLoad);

    // If iframe is already loaded, call startSession
    if (iframe.contentWindow?.document.readyState === "complete") {
      startSession();
    }

    // 3) Listen for END_SESSION
    const handleMessage = async (event) => {
      if (event.origin !== "https://plinko-game-main-two.vercel.app") return;
      const { type, netProfit, sessionId: childSessionId } = event.data || {};

      if (type === "END_SESSION") {
        console.log("Got END_SESSION from iframe. netProfit =", netProfit);

        // 4) End session in Firestore via userContext
        try {
          await endPlinkoSession(childSessionId, netProfit);
          // optionally navigate away or do something else
        } catch (err) {
          console.error("Error ending plinko session:", err);
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      iframe.removeEventListener("load", onIframeLoad);
      window.removeEventListener("message", handleMessage);
    };
  }, [userIsReady, id, balance, createPlinkoSession, endPlinkoSession]);

  if (!userIsReady) return <div>Loading user...</div>;

  return (
    <iframe
      ref={iframeRef}
      src="https://plinko-game-main-two.vercel.app"
      style={{ width: "100%", height: "100vh", border: "none" }}
      title="Plinko Game"
    />
  );
}

export default PlinkoIframePage;