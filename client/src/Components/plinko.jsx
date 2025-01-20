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

  // The user must be "ready": we have an id, we've initialized, and we're not loading
  const userIsReady = Boolean(id && initialized && !loading);

  // We'll embed the Plinko game in an iframe
  const iframeRef = useRef(null);

  // We'll keep on-screen logs
  const [logs, setLogs] = useState([]);

  function logMessage(msg) {
    setLogs(prev => [...prev, msg]);
    console.log(msg);
  }

  // Log user context on each render (optional)
  useEffect(() => {
    logMessage("==== On Render / Re-render ====");
    logMessage(`User context -> id: ${id}, balance: ${balance}, loading: ${loading}, initialized: ${initialized}`);
    logMessage(`userIsReady: ${userIsReady}`);
    // We do NOT do anything else here—just logging
  }, [id, balance, loading, initialized, userIsReady]);

  // The main effect that starts the session
  useEffect(() => {
    // If the user isn't ready, don't create a session
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

    // This function actually creates the Plinko session doc, then sends INIT_SESSION
    async function startSession() {
      try {
        logMessage("Attempting to create a new Plinko session in Firestore...");
        sessionId = await createPlinkoSession(); // Single doc creation
        logMessage(`Session created with ID: ${sessionId}`);

        const initMsg = {
          type: "INIT_SESSION",
          userId: id,
          sessionBalance: balance, // snapshot
          sessionId
        };
        logMessage("Sending INIT_SESSION to iframe: " + JSON.stringify(initMsg));

        iframe.contentWindow?.postMessage(initMsg, "https://plinko-game-main-two.vercel.app");
        logMessage("INIT_SESSION posted to the iframe.");
      } catch (err) {
        logMessage("ERROR starting plinko session: " + err.message);
      }
    }

    // We'll only call startSession once the iframe fires 'load'
    function onIframeLoad() {
      logMessage("Iframe 'load' event fired. We'll call startSession()...");
      startSession();
    }

    // 1) Listen for the 'load' event
    iframe.addEventListener("load", onIframeLoad);

    // 2) Listen for messages from the child
    const handleMessage = async (event) => {
      logMessage("Received postMessage from origin: " + event.origin);

      if (!event.origin.includes("plinko-game-main-two.vercel.app")) {
        logMessage("Ignoring untrusted origin: " + event.origin);
        return;
      }

      const { type, netProfit, sessionId: childSessionId } = event.data || {};
      logMessage(`Message => type: ${type}, netProfit: ${netProfit}, sessionId: ${childSessionId}`);

      if (type === "END_SESSION") {
        logMessage("Got END_SESSION from iframe. netProfit=" + netProfit);
        try {
          await endPlinkoSession(childSessionId, netProfit);
          logMessage("Session ended. netProfit = " + netProfit + ". Balance updated.");
        } catch (err) {
          logMessage("ERROR ending plinko session: " + err.message);
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // Cleanup function to remove event listeners
    return () => {
      iframe.removeEventListener("load", onIframeLoad);
      window.removeEventListener("message", handleMessage);
    };
  // << Important: We remove 'balance' from dependencies. 
  }, [userIsReady, id, createPlinkoSession, endPlinkoSession]); 

  // If user isn't ready, show loading...
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

  // Otherwise, render logs + iframe
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

      {/* The Iframe for Plinko */}
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