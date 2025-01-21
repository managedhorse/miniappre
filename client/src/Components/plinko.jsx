// plinko.jsx
import React, { useEffect, useRef, useState } from "react";
import { useUser } from "../context/userContext";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase"; // Adjust the path as necessary

function PlinkoIframePage() {
  // Destructure plinkoBalance from useUser if provided by context
  const { balance, plinkoBalance, id, loading, initialized, setBalance } = useUser();

  const userIsReady = Boolean(id && initialized && !loading);
  const iframeRef = useRef(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDirection, setTransferDirection] = useState("toPlinko");
  const [isTransferring, setIsTransferring] = useState(false);
  const [modalPlinkoBalance, setModalPlinkoBalance] = useState(null);

  // Function to request the child's current Plinko balance
  function requestChildPlinkoBalance() {
    return new Promise((resolve, reject) => {
      const requestId = Date.now().toString();
      function handleResponse(event) {
        if (!event.origin.includes("plinko-game-main-two.vercel.app")) return;
        const { type, requestId: respRequestId, plinkoBalance, message } = event.data || {};
        if (respRequestId !== requestId) return;
        if (type === 'TRANSFER_BALANCE_RESPONSE') {
          window.removeEventListener("message", handleResponse);
          resolve(plinkoBalance);
        } else if (type === 'TRANSFER_BALANCE_ERROR') {
          window.removeEventListener("message", handleResponse);
          reject(new Error(message));
        }
      }
      window.addEventListener("message", handleResponse);
      const iframe = iframeRef.current;
      if (iframe) {
        iframe.contentWindow?.postMessage(
          { type: 'TRANSFER_BALANCE_REQUEST', requestId },
          "https://plinko-game-main-two.vercel.app"
        );
      } else {
        reject(new Error("Iframe not available"));
      }
      setTimeout(() => {
        window.removeEventListener("message", handleResponse);
        reject(new Error("Timeout waiting for response"));
      }, 5000);
    });
  }

  useEffect(() => {
    if (!userIsReady) return;
  
    const iframe = iframeRef.current;
    if (!iframe) return;
  
    function handleMessage(event) {
      // Only process messages from the expected child origin
      if (!event.origin.includes("plinko-game-main-two.vercel.app")) return;
  
      const { type } = event.data || {};
  
      // Respond to REQUEST_USERID messages
      if (type === 'REQUEST_USERID') {
        if (id) {
          console.log(`Responding to REQUEST_USERID with id: ${id}`);
          // Respond directly to the source of the message using event.source
          event.source?.postMessage({ type: 'USERID', userId: id }, event.origin);
        } else {
          console.error("User ID not available to send.");
        }
      }
  
      // Handle additional message types as needed
    }
  
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [userIsReady, id]);

  // New useEffect to fetch plinkoBalance from iframe on load and sync with Firestore
  useEffect(() => {
    if (!userIsReady) return;

    async function fetchAndSyncPlinkoBalance() {
      try {
        const childPlinkoBalance = await requestChildPlinkoBalance();
        console.log('Fetched plinkoBalance from child:', childPlinkoBalance);

        // Update Firestore with the fetched plinkoBalance
        const userRef = doc(db, "telegramUsers", id.toString());
        await updateDoc(userRef, { plinkoBalance: childPlinkoBalance });
        console.log('Firestore updated with plinkoBalance:', childPlinkoBalance);

        // Optionally, update local storage
        localStorage.setItem('plinkoBalance', childPlinkoBalance.toString());

        // Update context or state if necessary
        if (setBalance) {
          // Fetch the main balance if needed
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setBalance(userData.balance || 0);
          }
        }
      } catch (error) {
        console.error('Error fetching and syncing plinko balance:', error);
      }
    }

    fetchAndSyncPlinkoBalance();
  }, [userIsReady, id, setBalance]);

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
  
    let childPlinkoBalance;
    try {
      childPlinkoBalance = await requestChildPlinkoBalance();
      console.log('Received plinkoBalance from child:', childPlinkoBalance);
    } catch(err) {
      console.error('Error getting balance from child:', err);
      alert('Failed to retrieve game balance from Plinko app.');
      setIsTransferring(false);
      return;
    }
  
    const userRef = doc(db, "telegramUsers", id.toString());
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      alert("User record not found.");
      setIsTransferring(false);
      return;
    }
    const data = userSnap.data();
    let currentBalance = data.balance || 0;
    let currentPlinkoBalance = childPlinkoBalance;
  
    if (transferDirection === "toPlinko") {
      if (currentBalance < amount) {
        alert("Not enough balance to transfer.");
        setIsTransferring(false);
        return;
      }
      currentBalance -= amount;
      currentPlinkoBalance += amount;
    } else {
      if (currentPlinkoBalance < amount) {
        alert("Not enough Plinko balance to withdraw.");
        setIsTransferring(false);
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
  
      // If withdrawing to main app, send a message to the child iframe to deduct the withdrawn amount
      if (transferDirection === "toMain") {
        if (iframeRef.current) {
          iframeRef.current.contentWindow?.postMessage(
            { type: 'DEDUCT_BALANCE', amount: amount },
            "https://plinko-game-main-two.vercel.app" // Child's origin
          );
        }
      }
      // NEW: If transferring to Plinko, send an ADD_BALANCE message to child
  if (transferDirection === "toPlinko") {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        { type: 'ADD_BALANCE', amount: amount },
        "https://plinko-game-main-two.vercel.app"
      );
    }
  }
  
      setModalOpen(false);
      setTransferAmount("");
      console.log("Transfer successful. New balances:", { balance: currentBalance, plinkoBalance: currentPlinkoBalance });
      if (setBalance) {
        setBalance(currentBalance);
      }
      // Optionally update the context or trigger a re-fetch for plinkoBalance here
    } catch (error) {
      console.error("Error updating balances:", error);
      alert("Error processing transfer.");
    }
    setIsTransferring(false);
  }
  

  if (!userIsReady) {
    return (
      <div style={{ padding: "1rem" }}>
        <h2>Loading user...</h2>
      </div>
    );
  }
  useEffect(() => {
    if (modalOpen && id) {
      async function updateModalBalance() {
        try {
          const userRef = doc(db, "telegramUsers", id.toString());
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const latestBalance = userData.plinkoBalance || 0;
            setModalPlinkoBalance(latestBalance);
          } else {
            console.error("User not found in Firestore.");
          }
        } catch (error) {
          console.error("Error fetching latest plinkoBalance:", error);
        }
      }
      updateModalBalance();
    }
  }, [modalOpen, id]);

  useEffect(() => {
   
      // Show the back button when the component mounts
      window.Telegram.WebApp.BackButton.show();
  
      // Attach a click event listener to handle the back navigation
      const handleBackButtonClick = () => {
        window.history.back();
      };
  
      window.Telegram.WebApp.BackButton.onClick(handleBackButtonClick);
  
      // Clean up the event listener and hide the back button when the component unmounts
      return () => {
        window.Telegram.WebApp.BackButton.offClick(handleBackButtonClick);
        window.Telegram.WebApp.BackButton.hide();
      };
  
    }, []);

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <button 
  style={{
    position: "absolute",
    top: "10px",
    left: "10px",
    zIndex: 10,
    backgroundColor: "#4CAF50",
    color: "#fff",
    padding: "6px 12px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px"
  }}
  onClick={async () => {
    if (!id) {
      alert("User ID not available.");
      return;
    }

    setIsTransferring(true); // Optionally show a loading state
    let childPlinkoBalance;
    try {
      // Request the current Plinko balance from the child app
      childPlinkoBalance = await requestChildPlinkoBalance();
      console.log('Fetched plinkoBalance on modal open:', childPlinkoBalance);
    } catch (err) {
      console.error('Error fetching balance on modal open:', err);
      alert('Failed to retrieve game balance from Plinko app.');
      setIsTransferring(false);
      return;
    }

    if (childPlinkoBalance !== undefined) {
      try {
        // Update Firestore with the latest plinkoBalance
        const userRef = doc(db, "telegramUsers", id.toString());
        await updateDoc(userRef, { plinkoBalance: childPlinkoBalance });
        console.log('Updated plinkoBalance in Firestore on modal open:', childPlinkoBalance);
      } catch (error) {
        console.error("Error updating balance on modal open:", error);
      }
    }

    setIsTransferring(false);
    setModalOpen(true); // Now open the modal
  }}
>
  Transfer Balance
</button>

      <iframe
        ref={iframeRef}
        src="https://plinko-game-main-two.vercel.app"
        style={{ width: "100%", height: "100%", border: "none" }}
        title="Plinko Game"
      />

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
      backgroundColor: "pink",
      color: "#000",
      padding: "20px", 
      borderRadius: "8px", 
      minWidth: "300px", 
      boxShadow: "0 4px 8px rgba(0,0,0,0.1)" 
    }}>
      <h2 style={{ marginBottom: "10px" }}>Transfer Balance</h2>
      
      {/* Display user balances */}
      <p><strong>Main Balance:</strong> {balance}</p>
      <p><strong>Plinko Balance:</strong> {modalPlinkoBalance !== null ? modalPlinkoBalance : "Loading..."}</p>
      
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
          // Set max attribute when withdrawing to main app
          max={transferDirection === "toMain" && modalPlinkoBalance !== null ? modalPlinkoBalance : undefined}
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