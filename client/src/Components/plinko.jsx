// PlinkoIframePage.jsx
import React, { useEffect, useRef, useState } from "react";
import { useUser } from "../context/userContext";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase"; // Adjust the path as necessary

function PlinkoIframePage() {
  const { balance, id, loading, initialized, setBalance } = useUser(); // Ensure `setBalance` exists in your context
  const userIsReady = Boolean(id && initialized && !loading);
  const iframeRef = useRef(null);

  // State for transfer modal
  const [modalOpen, setModalOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDirection, setTransferDirection] = useState("toPlinko");
  const [isTransferring, setIsTransferring] = useState(false); // To manage transfer state

  // Ref to store pending requests
  const pendingRequests = useRef(new Map());

  useEffect(() => {
    if (!userIsReady) return;

    function handleMessage(event) {
      // Verify the message comes from the trusted child origin
      if (!event.origin.includes("plinko-game-main-two.vercel.app")) return;
      
      const { type, requestId, plinkoBalance, message } = event.data || {};
      
      if (type === "TRANSFER_BALANCE_RESPONSE" && requestId) {
        const resolve = pendingRequests.current.get(requestId);
        if (resolve) {
          resolve({ plinkoBalance });
          pendingRequests.current.delete(requestId);
        }
      }

      if (type === "TRANSFER_BALANCE_ERROR" && requestId) {
        const reject = pendingRequests.current.get(requestId).reject;
        if (reject) {
          reject(new Error(message || "Unknown error during transfer."));
          pendingRequests.current.delete(requestId);
        }
      }

      // Handle other message types if necessary
    }

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [userIsReady]);

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

    setIsTransferring(true);

    try {
      // Generate a unique requestId
      const requestId = `transfer-${Date.now()}`;

      // Create a Promise that resolves when the response is received
      const plinkoBalance = await new Promise((resolve, reject) => {
        // Set up a timeout in case response is not received
        const timeout = setTimeout(() => {
          pendingRequests.current.delete(requestId);
          reject(new Error("Transfer request timed out."));
        }, 5000); // 5 seconds timeout

        // Store the resolve and reject functions
        pendingRequests.current.set(requestId, { resolve, reject });

        // Send the transfer request message
        iframeRef.current?.contentWindow?.postMessage(
          { type: "TRANSFER_BALANCE_REQUEST", requestId },
          "https://plinko-game-main-two.vercel.app" // Replace with your Plinko app's origin
        );
        console.log("TRANSFER_BALANCE_REQUEST sent to Plinko app with requestId:", requestId);
      });

      console.log("Received plinkoBalance from Plinko app:", plinkoBalance.plinkoBalance);

      if (transferDirection === "toPlinko") {
        // Transfer from main app to Plinko
        const userRef = doc(db, "telegramUsers", id.toString());
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          alert("User record not found.");
          setIsTransferring(false);
          return;
        }
        const data = userSnap.data();
        let currentBalance = data.balance || 0;
        let currentPlinkoBalance = data.plinkoBalance || 0;

        if (currentBalance < amount) {
          alert("Not enough balance to transfer.");
          setIsTransferring(false);
          return;
        }

        currentBalance -= amount;
        currentPlinkoBalance += amount;

        try {
          await updateDoc(userRef, {
            balance: currentBalance,
            plinkoBalance: currentPlinkoBalance
          });
          setModalOpen(false);
          setTransferAmount("");
          console.log("Transfer to Plinko successful.");
          // Update user context here to reflect new balances
          if (setBalance) {
            setBalance(currentBalance); // Update main balance in context
          }
        } catch (error) {
          console.error("Error updating balances:", error);
          alert("Error processing transfer.");
        }

      } else if (transferDirection === "toMain") {
        // Transfer from Plinko to main app
        const userRef = doc(db, "telegramUsers", id.toString());
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          alert("User record not found.");
          setIsTransferring(false);
          return;
        }
        const data = userSnap.data();
        let currentBalance = data.balance || 0;
        let currentPlinkoBalance = data.plinkoBalance || 0;

        if (currentPlinkoBalance < amount) {
          alert("Not enough Plinko balance to withdraw.");
          setIsTransferring(false);
          return;
        }

        currentBalance += amount;
        currentPlinkoBalance -= amount;

        try {
          await updateDoc(userRef, {
            balance: currentBalance,
            plinkoBalance: currentPlinkoBalance
          });
          setModalOpen(false);
          setTransferAmount("");
          console.log("Withdraw to Main App successful.");
          // Update user context here to reflect new balances
          if (setBalance) {
            setBalance(currentBalance); // Update main balance in context
          }
        } catch (error) {
          console.error("Error updating balances:", error);
          alert("Error processing transfer.");
        }
      }

    } catch (error) {
      console.error("Error during transfer:", error);
      alert(error.message);
    } finally {
      setIsTransferring(false);
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
      {/* Styled Transfer Balance button */}
      <button 
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 10,
          backgroundColor: "#4CAF50",
          color: "#fff",
          padding: "10px 20px",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "16px"
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
          <div style={{ 
            backgroundColor: "#fff", 
            color: "#000",
            padding: "20px", 
            borderRadius: "8px", 
            minWidth: "300px", 
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)" 
          }}>
            <h2 style={{ marginBottom: "10px" }}>Transfer Balance</h2>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ marginRight: "10px" }}>
                <input 
                  type="radio" 
                  name="direction" 
                  value="toPlinko" 
                  checked={transferDirection === "toPlinko"}
                  onChange={() => setTransferDirection("toPlinko")}
                />
                Transfer to Plinko
              </label>
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
            <div style={{ marginBottom: "20px" }}>
              <input 
                type="number" 
                placeholder="Amount" 
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                style={{ 
                  width: "100%", 
                  padding: "10px", 
                  boxSizing: "border-box", 
                  fontSize: "16px" 
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button 
                onClick={() => setModalOpen(false)} 
                style={{
                  backgroundColor: "#f44336",
                  color: "#fff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginRight: "10px",
                  fontSize: "16px"
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleTransfer}
                disabled={isTransferring}
                style={{
                  backgroundColor: isTransferring ? "#9E9E9E" : "#4CAF50",
                  color: "#fff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "4px",
                  cursor: isTransferring ? "not-allowed" : "pointer",
                  fontSize: "16px"
                }}
              >
                {isTransferring ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlinkoIframePage;
