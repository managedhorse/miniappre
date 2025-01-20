import React, { useEffect, useRef, useState } from "react";
import { useUser } from "../context/userContext";

function PlinkoIframePage() {
  const {
    id,
    loading,
    initialized,
    balance,
    // Our new helper
    createPlinkoSession,
    endPlinkoSession,
    getActivePlinkoSession // <--- new function in userContext
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

  useEffect(() => {
    if (!userIsReady) {
      log("Not ready yet, skipping session creation");
      return;
    }

    // If we already started once (in the same React mount), skip
    if (sessionStartedRef.current) return;
    sessionStartedRef.current = true;

    async function initSession() {
      if (!iframeRef.current) {
        log("iframeRef is null");
        return;
      }

      // 1) Attempt to find an active, unexpired session
      const existing = await getActivePlinkoSession();
      let sessionId = existing?.id;

      if (sessionId) {
        log("Found existing active session, reusing sessionId=" + sessionId);
      } else {
        log("No active session found. Creating new plinko session doc...");
        sessionId = await createPlinkoSession();
        log("Created new session: " + sessionId);
      }

      // 2) Send INIT_SESSION to the iframe
      const initMsg = {
        type: "INIT_SESSION",
        userId: id,
        sessionId,
        sessionBalance: balance // snapshot from userContext
      };
      log("Posting INIT_SESSION to iframe: " + JSON.stringify(initMsg));
      iframeRef.current.contentWindow?.postMessage(
        initMsg,
        "https://plinko-game-main-two.vercel.app"
      );
    }

    initSession();
  }, [userIsReady]);

  // Listen for END_SESSION from child
  useEffect(() => {
    function handleMessage(event) {
      if (!event.origin.includes("plinko-game-main-two.vercel.app")) return;
      const { type, netProfit, sessionId: childSessionId } = event.data || {};

      if (type === "END_SESSION") {
        log("END_SESSION => netProfit=" + netProfit);
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
    return <div>Loading user...</div>;
  }

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <div style={{ borderBottom: "1px solid #ccc", maxHeight: "200px", overflowY: "auto" }}>
        {logs.map((msg, i) => (
          <p style={{ margin: 0, color: "red" }} key={i}>{msg}</p>
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