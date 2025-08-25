// plinko.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useUser } from "../context/userContext.jsx";
import { spendFromWallet } from "../lib/spendFromWallet";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase"; // Adjust the path as necessary

function PlinkoIframePage() {
  const { balance, refBonus, SetRefBonus, id, loading, initialized, setBalance } = useUser()

  const userIsReady = Boolean(id && initialized && !loading);
  const iframeRef = useRef(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDirection, setTransferDirection] = useState("toPlinko");
  const [isTransferring, setIsTransferring] = useState(false);
  const [modalPlinkoBalance, setModalPlinkoBalance] = useState(null);
  const [frameReady, setFrameReady] = useState(false);
  const available = (balance || 0) + (refBonus || 0);
  // --- helper: ask child app for its balance (with timeout + cleanup) ---
  const requestChildPlinkoBalance = useCallback(() => {
    return new Promise((resolve, reject) => {
      const ORIGIN = "https://plinko-game-main-two.vercel.app";
      const requestId = Date.now().toString();

      function handleResponse(event) {
        if (!event.origin.includes("plinko-game-main-two.vercel.app")) return;
        const { type, requestId: rid, plinkoBalance, message } = event.data || {};
        if (rid !== requestId) return;

        window.removeEventListener("message", handleResponse);
        clearTimeout(timer);

        if (type === "TRANSFER_BALANCE_RESPONSE") {
          resolve(plinkoBalance);
        } else if (type === "TRANSFER_BALANCE_ERROR") {
          reject(new Error(message || "Child reported transfer error."));
        }
      }

      window.addEventListener("message", handleResponse);

      const iframe = iframeRef.current;
      if (!iframe) {
        window.removeEventListener("message", handleResponse);
        return reject(new Error("Iframe not available"));
      }

      iframe.contentWindow?.postMessage(
        { type: "TRANSFER_BALANCE_REQUEST", requestId },
        ORIGIN
      );

      const timer = setTimeout(() => {
        window.removeEventListener("message", handleResponse);
        reject(new Error("Timeout waiting for response"));
      }, 5000);
    });
  }, []);

  // --- child asks for our USERID; reply back ---
  useEffect(() => {
    if (!userIsReady) return;

    function handleMessage(event) {
      if (!event.origin.includes("plinko-game-main-two.vercel.app")) return;
      const { type } = event.data || {};
      if (type === "REQUEST_USERID" && id) {
        event.source?.postMessage({ type: "USERID", userId: id }, event.origin);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [userIsReady, id]);

  // --- sync child's plinkoBalance into Firestore once ready ---
  useEffect(() => {
    if (!userIsReady || !frameReady) return;

    (async () => {
      try {
        const childPlinkoBalance = await requestChildPlinkoBalance();
        const userRef = doc(db, "telegramUsers", id.toString());
        await updateDoc(userRef, { plinkoBalance: childPlinkoBalance });
        localStorage.setItem("plinkoBalance", String(childPlinkoBalance));

        if (setBalance) {
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const d = snap.data();
            setBalance(d.balance || 0);
          }
        }
      } catch (err) {
        console.error("Error fetching/syncing plinko balance:", err);
      }
    })();
  }, [userIsReady, frameReady, id, setBalance, requestChildPlinkoBalance]);

  // --- fetch latest plinkoBalance when the modal opens ---
  useEffect(() => {
    if (!modalOpen || !id) return;

    (async () => {
      try {
        const userRef = doc(db, "telegramUsers", id.toString());
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setModalPlinkoBalance(userData.plinkoBalance ?? 0);
        }
      } catch (error) {
        console.error("Error fetching latest plinkoBalance:", error);
      }
    })();
  }, [modalOpen, id]);

  // --- Telegram back button (safe-guarded) ---
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    tg?.BackButton?.show?.();

    const handleBackButtonClick = () => {
      window.history.back();
    };

    tg?.BackButton?.onClick?.(handleBackButtonClick);
    return () => {
      tg?.BackButton?.offClick?.(handleBackButtonClick);
      tg?.BackButton?.hide?.();
    };
  }, []);

  async function handleTransfer() {
  const amount = Math.floor(Number(transferAmount));
  if (!Number.isFinite(amount) || amount <= 0) {
    alert("Please enter a valid amount.");
    return;
  }
  if (!id) {
    alert("User ID not available.");
    return;
  }

  setIsTransferring(true);

  // 1) Ask child app for its up-to-date balance
  let childPlinkoBalance;
  try {
    childPlinkoBalance = await requestChildPlinkoBalance();
  } catch (err) {
    console.error("Error getting balance from child:", err);
    alert("Failed to retrieve game balance from Plinko app.");
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

  const data = userSnap.data() || {};
  const currentRefAccrued = data.refAccrued ?? data.refBonus ?? 0;
  const currentRefSpent   = data.refSpent ?? 0;
  const currentRefAvail   = Math.max(0, currentRefAccrued - currentRefSpent);
  let currentBalance      = data.balance || 0;
  let currentPlinko       = Number(childPlinkoBalance) || 0;

  try {
    if (transferDirection === "toPlinko") {
      // 2A) Deduct from wallet atomically (may consume from balance and/or refAvailable)
      const { balance: newBal, refAvailable: newRefAvail } =
        await spendFromWallet(db, id.toString(), amount);

      currentPlinko += amount;

      // 3A) Persist new plinko + recompute score
      await updateDoc(userRef, {
        balance: newBal,
        plinkoBalance: currentPlinko,
        score: newBal + newRefAvail,
      });

      // update local UI
      setBalance?.(newBal);
      SetRefBonus?.(newRefAvail);

      // tell child to add funds
      iframeRef.current?.contentWindow?.postMessage(
        { type: "ADD_BALANCE", amount },
        "https://plinko-game-main-two.vercel.app"
      );
    } else {
      // 2B) Withdraw back to main — only affects balance, not refAvailable
      if (currentPlinko < amount) {
        alert("Not enough Plinko balance to withdraw.");
        setIsTransferring(false);
        return;
      }
      currentPlinko -= amount;
      const newBal = currentBalance + amount;

      // score = balance + refAvailable (refAvailable unchanged on withdraw)
      await updateDoc(userRef, {
        balance: newBal,
        plinkoBalance: currentPlinko,
        score: newBal + currentRefAvail,
      });

      setBalance?.(newBal);

      // tell child to deduct funds
      iframeRef.current?.contentWindow?.postMessage(
        { type: "DEDUCT_BALANCE", amount },
        "https://plinko-game-main-two.vercel.app"
      );
    }

    setModalOpen(false);
    setTransferAmount("");
  } catch (error) {
    if (error?.message === "INSUFFICIENT_FUNDS") {
      alert("Not enough funds in your wallet (main + referral).");
    } else {
      console.error("Error updating balances:", error);
      alert("Error processing transfer.");
    }
  } finally {
    setIsTransferring(false);
  }
}


  // --- early return AFTER hooks are declared ---
  if (!userIsReady) {
    return (
      <div style={{ padding: "1rem" }}>
        <h2>Loading user...</h2>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <button
        style={{
          position: "absolute",
          top: "50px",
          left: "10px",
          zIndex: 10,
          backgroundImage:
            "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 50%, #ff9a9e 100%)",
          border: "2px solid #fff",
          borderRadius: "8px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
          color: "#fff",
          padding: "4px 8px",
          cursor: "pointer",
          fontSize: "12px",
          fontFamily: "'Slackey', cursive",
          textTransform: "uppercase",
        }}
        onClick={async () => {
          if (!id) {
            alert("User ID not available.");
            return;
          }

          setIsTransferring(true);
          let childPlinkoBalance;
          try {
            childPlinkoBalance = await requestChildPlinkoBalance();
          } catch (err) {
            console.error("Error fetching balance on modal open:", err);
            alert("Failed to retrieve game balance from Plinko app.");
            setIsTransferring(false);
            return;
          }

          if (childPlinkoBalance !== undefined) {
            try {
              const userRef = doc(db, "telegramUsers", id.toString());
              await updateDoc(userRef, { plinkoBalance: childPlinkoBalance });
            } catch (error) {
              console.error("Error updating balance on modal open:", error);
            }
          }

          setIsTransferring(false);
          setModalOpen(true);
        }}
      >
        Transfer Mianus
      </button>

      <iframe
        ref={iframeRef}
        src="https://plinko-game-main-two.vercel.app"
        style={{ width: "100%", height: "100%", border: "none" }}
        title="Plinko Game"
        onLoad={() => setFrameReady(true)}
      />

      {modalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          {/* Gradient border wrapper */}
          <div
            style={{
              backgroundImage:
                "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 50%, #ff9a9e 100%)",
              padding: "2px",
              borderRadius: "12px",
              boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
            }}
          >
            {/* Inner white panel */}
            <div
              style={{
                backgroundColor: "#fff",
                color: "#333",
                padding: "20px",
                borderRadius: "10px",
                minWidth: "320px",
                maxWidth: "400px",
                width: "90%",
                fontFamily: "'Slackey', cursive",
                textTransform: "uppercase",
              }}
            >
              <h2
                style={{
                  margin: "0 0 12px",
                  fontSize: "1.4rem",
                  textAlign: "center",
                  color: "#ff9a9e",
                }}
              >
                Transfer Balance
              </h2>

              {/* Balances (clickable “MAX”) */}
              <div
                style={{
                  marginBottom: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    cursor: "pointer",
                  }}
                  onClick={() => setTransferAmount(String(available))}
                >
                  <strong>Main Balance:</strong>
                  <span style={{ color: "#ff9a9e", textDecoration: "underline" }}>
                    {typeof balance === "number" ? balance.toFixed(2) : balance}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    setTransferAmount(
                      String(
                        modalPlinkoBalance !== null ? modalPlinkoBalance : 0
                      )
                    )
                  }
                >
                  <strong>Plinko Balance:</strong>
                  <span style={{ color: "#ff9a9e", textDecoration: "underline" }}>
                    {modalPlinkoBalance !== null
                      ? Number(modalPlinkoBalance).toFixed(2)
                      : "Loading..."}
                  </span>
                </div>
              </div>

              <hr style={{ margin: "12px 0", borderColor: "#ddd" }} />

              {/* Direction toggles */}
              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    backgroundColor: "#fafafa",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "1px solid #ddd",
                  }}
                >
                  {["toPlinko", "toMain"].map((dir) => {
                    const active = transferDirection === dir;
                    const label = dir === "toPlinko" ? "TO PLINKO" : "TO MAIN";
                    return (
                      <div
                        key={dir}
                        onClick={() => setTransferDirection(dir)}
                        style={{
                          flex: 1,
                          padding: "10px 0",
                          textAlign: "center",
                          cursor: "pointer",
                          backgroundColor: active ? "#ff9a9e" : "transparent",
                          color: active ? "#fff" : "#333",
                          fontWeight: active ? "bold" : "normal",
                          transition: "background-color 0.2s",
                        }}
                      >
                        {label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Amount input */}
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "bold",
                    color: "#333",
                  }}
                >
                  AMOUNT
                </label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  max={
                    transferDirection === "toMain" && modalPlinkoBalance !== null
                      ? modalPlinkoBalance
                      : undefined
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    boxSizing: "border-box",
                    fontSize: "1rem",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    outline: "none",
                  }}
                />
              </div>

              {/* Action buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                }}
              >
                <button
                  onClick={() => setModalOpen(false)}
                  style={{
                    backgroundColor: "#ccc",
                    color: "#333",
                    padding: "10px 16px",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontFamily: "'Slackey', cursive",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransfer}
                  disabled={isTransferring}
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 50%, #ff9a9e 100%)",
                    border: "2px solid #fff",
                    borderRadius: "6px",
                    color: "#fff",
                    padding: "10px 16px",
                    cursor: isTransferring ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontFamily: "'Slackey', cursive",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                    transition: "background 0.2s",
                  }}
                >
                  {isTransferring ? "Processing..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlinkoIframePage;
