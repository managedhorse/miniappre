import React, { useState, useEffect, useRef } from "react";
import { Wheel } from "spin-wheel";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase"; 
import { useUser } from "../context/userContext";
import { IoCheckmarkCircle, IoCloseCircle } from "react-icons/io5";
import pointerImage from "../images/pointer.webp";  
import congratspic from "../images/celebrate.gif";
import Animate from "../Components/Animate";

/** Helper to format 1234 => '1,234'. */
function formatNumber(num) {
  return num.toLocaleString("en-US");
}

/** Weighted slices. */
const baseSlices = [
  ...Array(25).fill({ label: "Lose", multiplier: 0, color: "#D30000" }),
  ...Array(24).fill({ label: "1.2×", multiplier: 1.2, color: "#FFD700" }),
  ...Array(4).fill({ label: "1.5×", multiplier: 1.5, color: "#FFA500" }),
  ...Array(6).fill({ label: "3×",   multiplier: 3,   color: "#1E90FF" }),
  ...Array(1).fill({ label: "10×",  multiplier: 10,  color: "#800080" }),
];

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function createWheelItems() {
  const shuffled = shuffleArray(baseSlices);
  return shuffled.map((slice) => ({
    label: slice.label,
    backgroundColor: slice.color,
    value: { multiplier: slice.multiplier },
  }));
}

export default function LuckyWheel() {
  const { 
    balance, 
    refBonus, 
    setBalance, 
    id,             // from userContext
    loading,        // from userContext, might indicate data fetch
    initialized     // from userContext, or we can add a custom flag
  } = useUser();

  // Wait for user data in context? If not "initialized," or no "id," 
  // we can interpret that as “not ready”.
  const userIsReady = Boolean(id && initialized && !loading);

  const totalBalance = balance + refBonus;
  const [items] = useState(createWheelItems);

  const containerRef = useRef(null);
  const wheelRef = useRef(null);

  const [betAmount, setBetAmount] = useState(10000);
  const [isSpinning, setIsSpinning] = useState(false);
  const [floatingText, setFloatingText] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [showCongratsGif, setShowCongratsGif] = useState(false);

  // Because the spin library is asynchronous, we keep refs for current
  // balance & bet so we can read them reliably when the spin stops.
  const balanceRef = useRef(balance);
  useEffect(() => { balanceRef.current = balance; }, [balance]);

  const betRef = useRef(0);

  // We'll also track whether the wheel is fully "mounted."
  // That way, we only let the user spin if the wheel is set up.
  const [wheelReady, setWheelReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    wheelRef.current = new Wheel(containerRef.current, {
      items,
      radius: 0.9,
      lineColor: "#000",
      lineWidth: 1,
      borderColor: "#000",
      borderWidth: 2,
      pointerAngle: 0,
      rotationResistance: -35,
      itemLabelFontSizeMax: 14,
      isInteractive: false,     // no manual flicking
      onRest: handleWheelRest,  // callback
    });
    // Mark the wheel as "ready" once it’s constructed
    setWheelReady(true);

    return () => {
      setWheelReady(false);
      if (wheelRef.current) {
        wheelRef.current.remove();
        wheelRef.current = null;
      }
    };
  }, [items]);

  function handleWheelRest(e) {
    setIsSpinning(false);
    if (typeof e.currentIndex !== "number") return;

    const curBalance = balanceRef.current;
    const betUsed = betRef.current;

    const winningItem = items[e.currentIndex];
    const { multiplier } = winningItem.value || {};

    if (!multiplier || multiplier === 0) {
      // lose
      setResultMessage(`You lost your bet of ${formatNumber(betUsed)} Mianus!`);
      setFloatingText(`-${formatNumber(betUsed)}`);
      setTimeout(() => setFloatingText(""), 2500);
    } else {
      // e.g. user bet 10,000 => multiplier=1.2 => they gain 12000 minus the bet they already paid?
      // Actually: If we interpret "1.2×" as net multiplier, we might do betUsed * multiplier
      // If the user has already subtracted the bet, then the “profit” is betUsed * multiplier
      const winnings = Math.floor(betUsed * multiplier); 
      const newBal = curBalance + winnings;

      updateDoc(doc(db, "telegramUsers", id), { balance: newBal })
        .catch(err => console.error("Error updating Firestore after spin:", err));

      setBalance(newBal);
      balanceRef.current = newBal;

      setResultMessage(`Congratulations! You won × ${multiplier}!`);
      setFloatingText(`+${formatNumber(winnings)}`);
      setShowCongratsGif(true);
      setTimeout(() => setFloatingText(""), 2500);
    }

    setShowResult(true);
    setTimeout(() => setShowResult(false), 5000);
  }

  async function handleSpin() {
    // 1. Basic checks:
    if (!wheelReady) return;            // If wheel not fully init’d
    if (!userIsReady) return;          // If user data not ready
    if (isSpinning) return;            // already spinning
    if (balance < 50000) return;       // min 50k
    if (betAmount < 10000) return;     // min bet 10k
    if (betAmount > balance) return;   // can't bet more than you have

    setIsSpinning(true);

    // 2. Subtract the bet from the user
    const newBal = balance - betAmount;
    try {
      await updateDoc(doc(db, "telegramUsers", id), { balance: newBal });
      setBalance(newBal);
      balanceRef.current = newBal;
    } catch (error) {
      console.error("Error subtracting bet:", error);
      setIsSpinning(false);
      return;
    }

    // 3. Store the bet in a ref so onRest can retrieve it
    betRef.current = betAmount;

    // 4. spin to random index
    if (wheelRef.current) {
      const randomIndex = Math.floor(Math.random() * items.length);
      wheelRef.current.spinToItem(
        randomIndex,
        4000, // 4s spin
        true, // center on slice
        2,    // revolve 2 times
        1     // clockwise
      );
    }
  }

  const canSpin = !isSpinning 
                  && wheelReady
                  && userIsReady
                  && balance >= 50000
                  && betAmount >= 10000
                  && betAmount <= balance;

  function renderPointer() {
    return (
      <img
        src={pointerImage}
        alt="pointer"
        style={{
          position: "absolute",
          top: "-20px",
          left: "50%",
          transform: "translateX(-50%) rotate(-45deg)",
          width: "40px",
          zIndex: 1000,
        }}
      />
    );
  }

  const handleCongratsAnimationEnd = () => {
    setShowCongratsGif(false);
  };

  return (
    <Animate>
      <div className="grid place-items-center px-3 pt-3 pb-[90px] relative">

        {/* Show total user balance + bonus */}
        <div className="text-white mb-2 text-center">
          Balance: {formatNumber(totalBalance)} Mianus
        </div>

        <div className="bg-activebg border border-activeborder rounded-lg w-full max-w-[420px] shadow-lg p-4">
          <h2 className="text-white slackey-regular text-[20px] font-medium text-center mb-2">
            Spin Mianus
          </h2>

          {/* Bet input & spin button */}
          <div className="flex items-center space-x-2 w-full">
            <input
              type="number"
              placeholder="Enter bet (≥ 10,000)"
              className="flex-1 py-1 px-2 rounded-md bg-white text-black border border-gray-300 focus:outline-none focus:border-blue-500"
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
            />

            <button
              onClick={handleSpin}
              disabled={!canSpin}
              className={`px-4 py-2 text-white rounded-md font-semibold transition-colors duration-300 ${
                canSpin
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-500 cursor-not-allowed"
              }`}
            >
              Spin
            </button>
          </div>

          {/* Warnings or instructions */}
          <div className="mt-2 text-sm text-red-400 min-h-[20px]">
            {(!wheelReady || !userIsReady) && <p>Please wait...</p>}
            {balance < 50000 && <p>You need ≥ 50,000 Mianus to play.</p>}
            {betAmount < 10000 && <p>Minimum bet is 10,000 Mianus.</p>}
            {betAmount > balance && <p>Bet cannot exceed your balance.</p>}
          </div>

          {/* Actual wheel container */}
          <div
            className="relative mx-auto mt-3"
            style={{
              width: "80vw",
              height: "80vw",
              maxWidth: "360px",
              maxHeight: "360px",
              overflow: "visible",
            }}
          >
            <div
              ref={containerRef}
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                margin: "0 auto",
                overflow: "hidden",
              }}
            />
            {renderPointer()}
          </div>
        </div>

        {/* ephemeral floating text (e.g. “+12000” or “-10000”) */}
        {floatingText && (
          <div
            className="absolute flex justify-center items-center top-[50%] left-[50%]
                      transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          >
            <div className="bg-black/60 text-white px-3 py-1 rounded-md animate-bounce">
              {floatingText}
            </div>
          </div>
        )}

        {/* Toastlike result message at bottom */}
        {showResult && (
          <div
            className="fixed left-0 right-0 mx-auto bottom-[80px]
                      flex justify-center z-[9999] px-4"
          >
            <div
              className={`flex items-center space-x-2 px-4 py-2
                          bg-[#121620ef] rounded-[8px] shadow-lg
                          text-sm w-fit
                          ${
                            resultMessage.includes("lost")
                              ? "text-red-400"
                              : "text-[#54d192]"
                          }`}
            >
              {resultMessage.includes("lost") ? (
                <IoCloseCircle size={24} />
              ) : (
                <IoCheckmarkCircle size={24} />
              )}
              <span className="font-medium slackey-regular">
                {resultMessage}
              </span>
            </div>
          </div>
        )}

        {/* Confetti GIF when user wins */}
        {showCongratsGif && !resultMessage.includes("lost") && (
          <div
            className="absolute top-[20%] left-0 right-0 
                      flex justify-center pointer-events-none select-none"
          >
            <img
              src={congratspic}
              alt="congrats"
              className="w-[160px] animate-fade-in-once"
              onAnimationEnd={handleCongratsAnimationEnd}
            />
          </div>
        )}
      </div>
    </Animate>
  );
}