import React, { useEffect, useRef, useState } from "react";
import { useUser } from "../context/userContext";

function PlinkoIframePage() {
  const {
    id,
    loading,
    initialized,
    balance,
    createPlinkoSession,
    endPlinkoSession,
    getActivePlinkoSession
  } = useUser();

  // Must be "ready"
  const userIsReady = !!(id && initialized && !loading);

  const iframeRef = useRef(null);
  const [logs, setLogs] = useState([]);
  const sessionStartedRef = useRef(false);

  function log(msg) {
    setLogs((prev) => [...prev, msg]);
    console.log(msg);
  }

  // Debug user context values
  useEffect(() => {
    console.log("== PlinkoIframePage ==");
    console.log("id:", id);
    console.log("initialized:", initialized);
    console.log("loading:", loading);
    console.log("balance:", balance);
  }, [id, initialized, loading, balance]);

  useEffect(() => {
    if (!userIsReady) {
      log("Not ready yet, skipping session creation");
      return;
    }
    if (sessionStartedRef.current) {
      log("Session is already started, skipping...");
      return;
    }
    sessionStartedRef.current = true;

    async function initSession() {
      if (!iframeRef.current) {
        log("iframeRef is null");
        return;
      }

      try {
        const existing = await getActivePlinkoSession();
        let sessionId = existing?.id;

        if (sessionId) {
          log("Found existing active session, reusing sessionId=" + sessionId);
        } else {
          log("No active session found. Creating new plinko session doc...");
          sessionId = await createPlinkoSession();
          log("Created new session: " + sessionId);
        }

        const initMsg = {
          type: "INIT_SESSION",
          userId: id,
          sessionId,
          sessionBalance: balance
        };
        log("Posting INIT_SESSION to iframe: " + JSON.stringify(initMsg));
        iframeRef.current.contentWindow?.postMessage(
          initMsg,
          "https://plinko-game-main-two.vercel.app"
        );
      } catch (err) {
        log("Error in initSession: " + err.message);
      }
    }

    initSession();
  }, [userIsReady]);

  useEffect(() => {
    function handleMessage(event) {
      // Only accept messages from the correct origin
      if (!event.origin.includes("plinko-game-main-two.vercel.app")) {
        return;
      }
      const { type, netProfit, sessionId: childSessionId } = event.data || {};

      if (type === "END_SESSION") {
        log(`END_SESSION => netProfit=${netProfit}, sessionId=${childSessionId}`);
        endPlinkoSession(childSessionId, netProfit)
          .then(() => {
            log("Session ended and netProfit applied to user balance.");
          })
          .catch((err) => log("Error ending session: " + err.message));
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [endPlinkoSession]);

  if (!userIsReady) {
    return (
      <div>
        <h3>Loading user data ...</h3>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <div
        style={{
          borderBottom: "1px solid #ccc",
          maxHeight: "200px",
          overflowY: "auto",
          padding: "0.5rem"
        }}
      >
        {logs.map((msg, i) => (
          <p style={{ margin: 0, color: "red" }} key={i}>
            {msg}
          </p>
        ))}
      </div>
      <iframe
        ref={iframeRef}
        src="https://plinko-game-main-two.vercel.app"
        style={{ width: "100%", height: "calc(100% - 200px)", border: "none" }}
      />
    </div>
  );
}

export default PlinkoIframePage;
