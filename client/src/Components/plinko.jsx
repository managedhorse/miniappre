import React, { useEffect, useRef } from "react";
import { useUser } from "../context/userContext";
import { db } from "../firebase";
import { doc, addDoc, updateDoc, collection, serverTimestamp } from "firebase/firestore";

function PlinkoIframePage() {
  const { balance, id, loading, initialized } = useUser();
  const userIsReady = Boolean(id && initialized && !loading);

  const iframeRef = useRef(null);

  // We'll only use the main balance for this Plinko session
  // (no refBonus).
  const sessionBalance = balance;

  useEffect(() => {
    if (!userIsReady) return;

    const iframe = iframeRef.current;
    if (!iframe) return;

    let sessionDocRef;

    // Step 1: Create a Session Doc in Firestore
    //         This helps track the session even if the user quits unexpectedly.
    const createSession = async () => {
      // Create a doc in e.g. "users/{id}/sessions" subcollection, or top-level "sessions".
      // Adjust to fit your schema. We'll store the initialBalance and a timestamp.
      const sessionsColl = collection(db, "users", id, "plinkoSessions");
      const sessionDoc = await addDoc(sessionsColl, {
        userId: id,
        initialBalance: sessionBalance,
        netProfit: 0, // Start at 0
        active: true, // Mark it active
        createdAt: serverTimestamp(),
      });

      sessionDocRef = sessionDoc;
      console.log("Created new Plinko session doc:", sessionDocRef.id);

      // Step 2: Send INIT_SESSION to the iframe
      iframe.contentWindow.postMessage(
        {
          type: "INIT_SESSION",
          userId: id,
          sessionBalance, // Only using main balance
          sessionId: sessionDocRef.id, // Pass the Firestore session doc ID
        },
        "https://plinko-game-main-two.vercel.app"
      );
    };

    // Call createSession once the iframe loads
    const onIframeLoad = () => {
      createSession().catch((err) => console.error("Error creating session:", err));
    };
    iframe.addEventListener("load", onIframeLoad);

    // Also call it immediately in case the iframe is already loaded
    if (iframe.contentWindow?.document.readyState === "complete") {
      createSession().catch((err) => console.error("Error creating session:", err));
    }

    // Step 3: Listen for END_SESSION
    const handleMessage = async (event) => {
      if (event.origin !== "https://plinko-game-main-two.vercel.app") return;
      const { type, netProfit, sessionId } = event.data || {};

      if (type === "END_SESSION") {
        console.log("END_SESSION from Plinko:", { netProfit, sessionId });

        // Update the session doc’s netProfit and mark it inactive
        // If you stored the doc ID in `sessionId`, you can reference it:
        if (sessionId) {
          const userSessionDoc = doc(db, "users", id, "plinkoSessions", sessionId);
          await updateDoc(userSessionDoc, {
            netProfit,
            active: false,
          });
        }

        // 4) Update the user's main balance in Firestore
        const updatedBalance = balance + netProfit;
        await updateDoc(doc(db, "users", id), {
          balance: updatedBalance,
        });
        console.log("Updated user’s balance in Firestore to:", updatedBalance);

        // (Optional) navigate away, show a “session ended” message, etc.
      }
    };

    window.addEventListener("message", handleMessage);

    // Cleanup
    return () => {
      iframe.removeEventListener("load", onIframeLoad);
      window.removeEventListener("message", handleMessage);
    };
  }, [userIsReady, id, balance]);

  if (!userIsReady) {
    return <div>Loading user...</div>;
  }

  return (
    <iframe
      ref={iframeRef}
      src="https://plinko-game-main-two.vercel.app"
      title="Plinko Game"
      style={{ width: "100%", height: "100vh", border: "none" }}
    />
  );
}

export default PlinkoIframePage;
