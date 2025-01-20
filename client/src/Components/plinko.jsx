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

  // Track whether we've already set up the session once
  const didSessionStart = useRef(false);

  // We'll keep on-screen logs
  const [logs, setLogs] = useState([]);

  function logMessage(msg) {
    setLogs((prev) => [...prev, msg]);
    console.log(msg);
  }

  // ----------------------------------------------------------------
  // 1) Debug effect: logs only when ID/loading/initialized/userIsReady changes
  //    (Removed 'balance' from dependencies to prevent excessive re-logs.)
  // ----------------------------------------------------------------
  useEffect(() => {
    logMessage("==== On Render / Re-render (ID/Init) ====");
    logMessage(`User context -> id: ${id}, loading: ${loading}, initialized: ${initialized}`);
    logMessage(`userIsReady: ${userIsReady}`);
  }, [id, loading, initialized, userIsReady]);

  // ----------------------------------------------------------------
  // 2) Main effect that starts a new Plinko session (runs once per mount)
  // ----------------------------------------------------------------
  useEffect(() => {
    // If user isn't ready, skip
    if (!userIsReady) {
      logMessage("User is NOT ready yet. Aborting session start.");
      return;
    }

    // If we already started the session, skip
    if (didSessionStart.current) {
      logMessage("Session already started; skipping new event listener.");
      return;
    }
    didSessionStart.current = true;

    // Now we can safely proceed
    const iframe = iframeRef.current;
    if (!iframe) {
      logMessage("ERROR: iframeRef is null; cannot create session.");
      return;
    }

    logMessage("iframeRef is valid. Adding 'load' event listener...");

    let sessionId = null;

    // Actually create the Plinko session doc, then send INIT_SESSION
    async function startSession() {
      try {
        logMessage("Attempting to create a new Plinko session in Firestore...");
        sessionId = await createPlinkoSession();
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

    // Cleanup function to remove event listeners when component unmounts
    return () => {
      iframe.removeEventListener("load", onIframeLoad);
      window.removeEventListener("message", handleMessage);
    };

    // We intentionally do not include 'balance' in dependencies to avoid
    // re-starting the session whenever balance changes.
  }, [userIsReady, id, createPlinkoSession, endPlinkoSession]);

  // ----------------------------------------------------------------
  // Rendering:
  // ----------------------------------------------------------------
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
