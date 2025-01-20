// plinko.jsx
import React, { useEffect, useRef, useState } from "react";
import { useUser } from "../context/userContext";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase"; // Adjust the path as necessary

function PlinkoIframePage() {
  const { balance, id, loading, initialized } = useUser();

  // The user must be ready: we have an id, initialized, and not loading
  const userIsReady = Boolean(id && initialized && !loading);

  // Reference to the iframe element
  const iframeRef = useRef(null);

  // State for transfer modal
  const [modalOpen, setModalOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDirection, setTransferDirection] = useState("toPlinko");

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

    const handleMessage = (event) => {
      if (!event.origin.includes("plinko-game-main-two.vercel.app")) {
        return;
      }
      // Additional message handling can be added here if required
    };
    window.addEventListener("message", handleMessage);

    return () => {
      iframe.removeEventListener("load", onIframeLoad);
      window.removeEventListener("message", handleMessage);
    };
  }, [userIsReady, id]);

  async function handleTransfer() {
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    if (!id) {
      alert("User ID not available.");
      return;
    }

    const userRef = doc(db, "telegramUsers", id.toString());
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      alert("User record not found.");
      return;
    }
    const data = userSnap.data();
    let currentBalance = data.balance || 0;
    let currentPlinkoBalance = data.plinkoBalance || 0;

    if (transferDirection === "toPlinko") {
      if (currentBalance < amount) {
        alert("Not enough balance to transfer.");
        return;
      }
      currentBalance -= amount;
      currentPlinkoBalance += amount;
    } else {
      if (currentPlinkoBalance < amount) {
        alert("Not enough Plinko balance to withdraw.");
        return;
      }
      currentBalance += amount;
      currentPlinkoBalance -= amount;
    }

    try {
      await updateDoc(userRef, {
        balance: currentBalance,
        plinkoBalance: currentPlinkoBalance
      });
      setModalOpen(false);
      setTransferAmount("");
      // Optionally, trigger user context update to reflect new balances
    } catch (error) {
      console.error("Error updating balances:", error);
      alert("Error processing transfer.");
    }
  }

  if (!userIsReady) {
    return (
      <div style={{ padding: "1rem" }}>
        <h2>Loading user...</h2>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      {/* Button to open transfer modal */}
      <button 
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 10
        }}
        onClick={() => setModalOpen(true)}
      >
        Transfer Balance
      </button>

      {/* The Iframe for Plinko */}
      <iframe
        ref={iframeRef}
        src="https://plinko-game-main-two.vercel.app"
        style={{ width: "100%", height: "100%", border: "none" }}
        title="Plinko Game"
      />

      {/* Transfer Modal */}
      {modalOpen && (
        <div 
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100
          }}
        >
          <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "8px", minWidth: "300px" }}>
            <h2>Transfer Balance</h2>
            <div>
              <label>
                <input 
                  type="radio" 
                  name="direction" 
                  value="toPlinko" 
                  checked={transferDirection === "toPlinko"}
                  onChange={() => setTransferDirection("toPlinko")}
                />
                Transfer to Plinko
              </label>
              <br/>
              <label>
                <input 
                  type="radio" 
                  name="direction" 
                  value="toMain" 
                  checked={transferDirection === "toMain"}
                  onChange={() => setTransferDirection("toMain")}
                />
                Withdraw to Main App
              </label>
            </div>
            <div style={{ marginTop: "10px" }}>
              <input 
                type="number" 
                placeholder="Amount" 
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setModalOpen(false)} style={{ marginRight: "10px" }}>
                Cancel
              </button>
              <button onClick={handleTransfer}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlinkoIframePage;