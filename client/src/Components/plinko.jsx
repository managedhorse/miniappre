import React, { useEffect, useRef, useState } from "react";
import { useUser } from "../context/userContext";

function PlinkoIframePage() {
  // Extract context
  const { 
    balance, 
    id, 
    loading, 
    initialized, 
    createPlinkoSession, 
    endPlinkoSession 
  } = useUser();

  // Flag to see if user data is ready
  const userIsReady = Boolean(id && initialized && !loading);

  // Use a ref for the iframe
  const iframeRef = useRef(null);

  // We'll keep a list of messages or errors to display on screen.
  const [logs, setLogs] = useState([]);

  // Helper function: push a message to our on-screen logs
  function logMessage(message) {
    setLogs((prev) => [...prev, message]);
    console.log(message); // optional: still console.log for reference
  }

  // Immediately log the user context on render
  useEffect(() => {
    logMessage("==== On Render / Re-render ====");
    logMessage(`User context -> id: ${id}, balance: ${balance}, loading: ${loading}, initialized: ${initialized}`);
    logMessage(`userIsReady: ${userIsReady}`);
  }, [id, balance, loading, initialized, userIsReady]);

  useEffect(() => {
    // If user context is not ready, let’s log that we’re waiting
    if (!userIsReady) {
      logMessage("User is NOT ready yet (loading, missing ID, or not initialized).");
      return;
    }

    // Otherwise, we proceed
    logMessage("User is ready (has ID, is not loading, is initialized). Checking iframeRef...");

    const iframe = iframeRef.current;
    if (!iframe) {
      logMessage("ERROR: iframeRef is null, cannot start session. Possibly the <iframe> hasn't mounted?");
      return;
    }

    logMessage("iframeRef is valid. We'll add 'load' event listener and check document.readyState.");

    let sessionId = null;

    // The function that starts a new session
    async function startSession() {
      try {
        logMessage("Attempting to create a new Plinko session in Firestore...");
        sessionId = await createPlinkoSession();
        logMessage(`Session created with ID: ${sessionId}`);

        // Post INIT_SESSION message to the iframe
        const initMsg = {
          type: "INIT_SESSION",
          userId: id,
          sessionBalance: balance,
          sessionId,
        };
        logMessage(`Sending INIT_SESSION to iframe. Data = ${JSON.stringify(initMsg)}`);

        iframe.contentWindow?.postMessage(initMsg, "https://plinko-game-main-two.vercel.app");
        logMessage("INIT_SESSION posted to iframe (target: https://plinko-game-main-two.vercel.app).");
      } catch (err) {
        logMessage("ERROR starting plinko session: " + err.message);
      }
    }

    // Called when the iframe "load" event fires
    function onIframeLoad() {
      logMessage("Iframe 'load' event fired. We will call startSession() now...");
      startSession();
    }

    // Attach the load event
    iframe.addEventListener("load", onIframeLoad);

    // If the iframe is already loaded, we check its document.readyState
    const isAlreadyLoaded = iframe.contentWindow?.document.readyState === "complete";
    if (isAlreadyLoaded) {
      logMessage("Iframe is already fully loaded. Will call startSession() immediately...");
      startSession();
    } else {
      logMessage(`Iframe is NOT fully loaded yet (readyState = ${
        iframe.contentWindow?.document.readyState
      }). We'll wait for the 'load' event.`);
    }

    // Listen for END_SESSION messages
    const handleMessage = async (event) => {
      logMessage(`Received a postMessage event from origin: ${event.origin}`);

      // Loosen the check: accept anything containing plinko-game-main-two.vercel.app
      if (!event.origin.includes("plinko-game-main-two.vercel.app")) {
        logMessage(`Ignoring message from untrusted origin: ${event.origin}`);
        return;
      }

      const { type, netProfit, sessionId: childSessionId } = event.data || {};
      logMessage(`Message details -> type: ${type}, netProfit: ${netProfit}, sessionId: ${childSessionId}`);

      // If we get END_SESSION, finalize
      if (type === "END_SESSION") {
        logMessage(`Got END_SESSION from iframe with netProfit = ${netProfit}. Attempting to end session...`);

        try {
          await endPlinkoSession(childSessionId, netProfit);
          logMessage(`Session ended in Firestore. Net profit was ${netProfit}. Updated user balance accordingly.`);
        } catch (err) {
          logMessage("ERROR ending plinko session: " + err.message);
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // Cleanup function
    return () => {
      iframe.removeEventListener("load", onIframeLoad);
      window.removeEventListener("message", handleMessage);
    };
  }, [userIsReady, id, balance, createPlinkoSession, endPlinkoSession]);

  // If user isn't ready, we display "Loading user..." + logs
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

  // Otherwise, we render the logs plus the iframe
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      {/* Verbose debug log area */}
      <div
        style={{
          padding: "0.5rem",
          backgroundColor: "#fff",
          color: "#000",
          maxHeight: "200px",
          overflowY: "auto",
          borderBottom: "1px solid #ccc"
        }}
      >
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
