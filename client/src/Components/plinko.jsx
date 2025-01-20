// plinko.jsx
import React, { useEffect, useRef } from "react";
import { useUser } from "../context/userContext";

function PlinkoIframePage() {
  const { balance, id, loading, initialized } = useUser();

  // The user must be ready: we have an id, initialized, and not loading
  const userIsReady = Boolean(id && initialized && !loading);

  // Reference to the iframe element
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!userIsReady) {
      return;
    }

    const iframe = iframeRef.current;
    if (!iframe) {
      return;
    }

    function onIframeLoad() {
      const initMsg = {
        type: "INIT_SESSION",
        userId: id
      };
      iframe.contentWindow?.postMessage(initMsg, "https://plinko-game-main-two.vercel.app");
    }

    // Add load event listener to the iframe
    iframe.addEventListener("load", onIframeLoad);

    // Optional: Listen for messages from the iframe if needed in future
    const handleMessage = (event) => {
      if (!event.origin.includes("plinko-game-main-two.vercel.app")) {
        return;
      }
      // Additional message handling can be added here if required
    };
    window.addEventListener("message", handleMessage);

    // Cleanup event listeners on unmount
    return () => {
      iframe.removeEventListener("load", onIframeLoad);
      window.removeEventListener("message", handleMessage);
    };
  }, [userIsReady, id]);

  if (!userIsReady) {
    return (
      <div style={{ padding: "1rem" }}>
        <h2>Loading user...</h2>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      {/* Embed the Plinko game in an iframe */}
      <iframe
        ref={iframeRef}
        src="https://plinko-game-main-two.vercel.app"
        style={{ width: "100%", height: "100%", border: "none" }}
        title="Plinko Game"
      />
    </div>
  );
}

export default PlinkoIframePage;
