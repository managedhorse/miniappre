import React, { useEffect, useRef, useState } from "react";
import { useUser } from "../context/userContext";

function PlinkoIframePage() {
  const { balance, id, loading, initialized, createPlinkoSession, endPlinkoSession } = useUser();
  const userIsReady = Boolean(id && initialized && !loading);
  const iframeRef = useRef(null);

  // We'll keep a list of messages or errors to display on screen.
  const [logs, setLogs] = useState([]);

  // Helper function to append a message to our on-screen log
  // Use plain JS:
function logMessage(message) {
    setLogs((prev) => [...prev, message]);
  }

  useEffect(() => {
    if (!userIsReady) {
      logMessage("User is not ready yet (loading or missing ID).");
      return;
    }

    const iframe = iframeRef.current;
    if (!iframe) {
      logMessage("iframeRef is null; cannot start session.");
      return;
    }

    let sessionId = null;

    async function startSession() {
      try {
        logMessage("Attempting to create a new Plinko session in Firestore...");
        sessionId = await createPlinkoSession();
        logMessage(`Session created with ID: ${sessionId}`);

        // 2) Post INIT_SESSION to the iframe
        const msg = {
          type: "INIT_SESSION",
          userId: id,
          sessionBalance: balance,
          sessionId,
        };
        logMessage(`Sending INIT_SESSION to iframe: ${JSON.stringify(msg)}`);

        iframe.contentWindow?.postMessage(msg, "https://plinko-game-main-two.vercel.app");
        logMessage("INIT_SESSION posted to iframe.");
      } catch (err) {
        logMessage("Error starting plinko session: " + err.message);
      }
    }

    function onIframeLoad() {
      logMessage("Iframe loaded event fired. Starting session...");
      startSession();
    }

    iframe.addEventListener("load", onIframeLoad);

    // If iframe is already loaded, call startSession
    if (iframe.contentWindow?.document.readyState === "complete") {
      logMessage("Iframe is already fully loaded. Starting session immediately...");
      startSession();
    }

    // 3) Listen for END_SESSION
    const handleMessage = async (event) => {
      logMessage(`Received message from origin: ${event.origin}`);

      // Loosen the check to allow subdomains, trailing slashes, etc.
      if (!event.origin.includes("plinko-game-main-two.vercel.app")) {
        logMessage(`Ignoring message from untrusted origin: ${event.origin}`);
        return;
      }

      const { type, netProfit, sessionId: childSessionId } = event.data || {};
      if (type === "END_SESSION") {
        logMessage(`Got END_SESSION from iframe with netProfit=${netProfit}, sessionId=${childSessionId}`);

        try {
          await endPlinkoSession(childSessionId, netProfit);
          logMessage(`Session ended. Net profit = ${netProfit}. User balance updated in Firestore.`);
        } catch (err) {
          logMessage("Error ending plinko session: " + err.message);
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
      <div>
        <p>Loading user...</p>
        {logs.map((msg, i) => (
          <p key={i} style={{ color: "red" }}>{msg}</p>
        ))}
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      {/* Display any debug/error messages */}
      <div style={{ padding: "0.5rem", backgroundColor: "#fff", color: "#000", maxHeight: "200px", overflowY: "auto" }}>
        <h3 style={{ margin: 0 }}>Debug/Errors:</h3>
        {logs.map((msg, i) => (
          <p key={i} style={{ margin: 0, padding: 0, color: "red" }}>{msg}</p>
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
