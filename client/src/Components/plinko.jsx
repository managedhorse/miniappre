// plinko.jsx
import React, { useEffect, useRef, useState } from "react";
import { useUser } from "../context/userContext";

function PlinkoIframePage() {
  const { 
    balance, 
    id, 
    loading, 
    initialized, 
    createPlinkoSession, 
    endPlinkoSession 
  } = useUser();

  const userIsReady = Boolean(id && initialized && !loading);
  const iframeRef = useRef(null);

  const [logs, setLogs] = useState([]);

  function logMessage(msg) {
    setLogs(prev => [...prev, msg]);
    console.log(msg);
  }

  useEffect(() => {
    logMessage("==== On Render / Re-render ====");
    logMessage(`User context -> id: ${id}, balance: ${balance}, loading: ${loading}, initialized: ${initialized}`);
    logMessage(`userIsReady: ${userIsReady}`);
  }, [id, balance, loading, initialized, userIsReady]);

  useEffect(() => {
    if (!userIsReady) {
      logMessage("User is NOT ready yet. Aborting session start.");
      return;
    }

    const iframe = iframeRef.current;
    if (!iframe) {
      logMessage("ERROR: iframeRef is null; cannot create session.");
      return;
    }

    logMessage("iframeRef is valid. Adding 'load' event listener...");

    let sessionId = null;

    async function startSession() {
      try {
        logMessage("Attempting to create a new Plinko session in Firestore...");
        sessionId = await createPlinkoSession();
        logMessage(`Session created with ID: ${sessionId}`);

        const initMsg = {
          type: "INIT_SESSION",
          userId: id,
          sessionBalance: balance,
          sessionId
        };
        logMessage(`Sending INIT_SESSION to iframe: ${JSON.stringify(initMsg)}`);

        iframe.contentWindow?.postMessage(initMsg, "https://plinko-game-main-two.vercel.app");
        logMessage("INIT_SESSION posted to the iframe.");
      } catch (err) {
        logMessage("ERROR starting plinko session: " + err.message);
      }
    }

    function onIframeLoad() {
      logMessage("Iframe 'load' event fired. Calling startSession()...");
      startSession();
    }

    iframe.addEventListener("load", onIframeLoad);

    const isLoaded = iframe.contentWindow?.document.readyState === "complete";
    if (isLoaded) {
      logMessage("Iframe is already loaded. Starting session immediately...");
      startSession();
    } else {
      logMessage(`Iframe not fully loaded (readyState = ${iframe.contentWindow?.document.readyState}). Waiting for 'load' event.`);
    }

    // Listen for messages from the child
    const handleMessage = async (event) => {
      logMessage(`Received postMessage from origin: ${event.origin}`);

      if (!event.origin.includes("plinko-game-main-two.vercel.app")) {
        logMessage(`Ignoring untrusted origin: ${event.origin}`);
        return;
      }

      const { type, netProfit, sessionId: childSessionId } = event.data || {};
      logMessage(`Message details => type: ${type}, netProfit: ${netProfit}, sessionId: ${childSessionId}`);

      if (type === "END_SESSION") {
        logMessage(`Got END_SESSION from iframe. netProfit=${netProfit}. Ending session in Firestore...`);
        try {
          await endPlinkoSession(childSessionId, netProfit);
          logMessage(`Session ended. netProfit = ${netProfit}. Balance updated.`);
        } catch (err) {
          logMessage("ERROR ending plinko session: " + err.message);
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      iframe.removeEventListener("load", onIframeLoad);
      window.removeEventListener("message", handleMessage);
    };
  }, [userIsReady, id, balance, createPlinkoSession, endPlinkoSession]);

  if (!userIsReady) {
    return (
      <div style={{ padding: "1rem" }}>
        <h2>Loading user...</h2>
        <div style={{ backgroundColor: "#f2f2f2", padding: "1rem", marginTop: "1rem" }}>
          <h3>Debug / Errors</h3>
          {logs.map((msg, i) => (
            <p key={i} style={{ margin: 0, color: "red" }}>
              {msg}
            </p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <div style={{ padding: "0.5rem", backgroundColor: "#fff", color: "#000", maxHeight: "200px", overflowY: "auto", borderBottom: "1px solid #ccc" }}>
        <h3 style={{ margin: 0 }}>Debug / Errors</h3>
        {logs.map((msg, i) => (
          <p key={i} style={{ margin: 0, padding: 0, color: "red", fontSize: "0.9rem" }}>
            {msg}
          </p>
        ))}
      </div>

      <iframe
        ref={iframeRef}
        src="https://plinko-game-main-two.vercel.app"
        style={{ width: "100%", height: "calc(100% - 200px)", border: "none" }}
        title="Plinko Game"
      />
    </div>
  );
}

export default PlinkoIframePage;