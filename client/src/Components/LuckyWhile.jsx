import React, { useState, useEffect, useRef } from "react";
import { Wheel } from "spin-wheel";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase"; 
import { useUser } from "../context/userContext";
import { IoCheckmarkCircle, IoCloseCircle } from "react-icons/io5";
import pointerImage from "../images/pointer.webp";  
import congratspic from "../images/celebrate.gif";
import Animate from "../Components/Animate";

/** Helper to format numbers (1,234). */
function formatNumber(num) {
  return num.toLocaleString("en-US");
}

/** Weighted slices: 25 Lose, 24 x1.2, etc. */
const baseSlices = [
  ...Array(25).fill({ label: "Lose", multiplier: 0, color: "#D30000" }),
  ...Array(24).fill({ label: "1.2×", multiplier: 1.2, color: "#FFD700" }),
  ...Array(4).fill({ label: "1.5×", multiplier: 1.5, color: "#FFA500" }),
  ...Array(6).fill({ label: "3×",   multiplier: 3,   color: "#1E90FF" }),
  ...Array(1).fill({ label: "10×",  multiplier: 10,  color: "#800080" }),
];

/** Shuffle for random distribution. */
function shuffleArray(arr) {
  const clone = [...arr];
  for (let i = clone.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

/** Convert slices => spin-wheel items with label/color/value. */
function createWheelItems() {
  const shuffled = shuffleArray(baseSlices);
  return shuffled.map((slice) => ({
    label: slice.label,
    backgroundColor: slice.color,
    value: { multiplier: slice.multiplier },
  }));
}

export default function LuckyWheel() {
  const { balance, refBonus, setBalance, id } = useUser();
  const totalBalance = balance + refBonus;

  // Build items (once) for the spin-wheel.
  const [items] = useState(createWheelItems);

  // Refs for the wheel container & instance
  const containerRef = useRef(null);
  const wheelRef = useRef(null);

  // UI states
  const [betAmount, setBetAmount] = useState(10000);
  const [isSpinning, setIsSpinning] = useState(false);
  const [floatingText, setFloatingText] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [showCongratsGif, setShowCongratsGif] = useState(false);

  // We store the user’s latest balance in a ref 
  // so the onRest callback can safely read it.
  const balanceRef = useRef(balance);
  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);

  // We also store the last bet used, so onRest can know how much was wagered.
  // (Alternatively, we can store the bet in the state at spin time.)
  const betRef = useRef(0);

  /** Initialize the wheel. */
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
      isInteractive: false, // Disallow manual flicking
      onRest: handleWheelRest, // Called when spin completes
    });

    return () => {
      if (wheelRef.current) {
        wheelRef.current.remove();
        wheelRef.current = null;
      }
    };
  }, [items]);

  /**
   * Called by the spin-wheel library once the spin finishes.
   * 'e' includes: { type: 'rest', currentIndex, rotation, ... }
   */
  function handleWheelRest(e) {
    setIsSpinning(false);
    if (typeof e.currentIndex !== "number") return; // Defensive check

    const currentBalance = balanceRef.current;
    const betUsed = betRef.current;
    const winningItem = items[e.currentIndex];
    const { multiplier } = winningItem.value || {};

    if (!multiplier) {
      // If multiplier=0 => lose
      setResultMessage(`You lost your bet of ${formatNumber(betUsed)} Mianus!`);
      setFloatingText(`-${formatNumber(betUsed)}`);
      setTimeout(() => setFloatingText(""), 2500);
    } else {
      // E.g. a 1.2× slice => user gets betUsed * 1.2
      // We already subtracted the bet prior to spin => net gain is betUsed * multiplier
      const winnings = Math.floor(betUsed * multiplier);
      const newBalance = currentBalance + winnings;

      // Firestore update
      updateDoc(doc(db, "telegramUsers", id), { balance: newBalance })
        .catch(console.error);

      setBalance(newBalance);
      balanceRef.current = newBalance;

      setResultMessage(`Congratulations! You won × ${multiplier}!`);
      setFloatingText(`+${formatNumber(winnings)}`);
      setShowCongratsGif(true);
      setTimeout(() => setFloatingText(""), 2500);
    }

    // Show toast for ~5s
    setShowResult(true);
    setTimeout(() => setShowResult(false), 5000);
  }

  /** Called when user clicks "Spin" button. */
  async function handleSpin() {
    if (isSpinning) return;
    if (balance < 50000) return;      // require at least 50k
    if (betAmount < 10000) return;    // minimum bet = 10k
    if (betAmount > balance) return;  // can't bet more than you have

    setIsSpinning(true);

    // Subtract bet from user’s balance right away
    const newBalance = balance - betAmount;
    try {
      await updateDoc(doc(db, "telegramUsers", id), { balance: newBalance });
      setBalance(newBalance);
      balanceRef.current = newBalance;
    } catch (err) {
      console.error("Error subtracting bet:", err);
      setIsSpinning(false);
      return;
    }

    // Store the bet we used, so onRest can know how much we risked
    betRef.current = betAmount;

    // Pick random slice => spinToItem
    if (wheelRef.current) {
      const randomIndex = Math.floor(Math.random() * items.length);
      wheelRef.current.spinToItem(
        randomIndex,
        4000,  // ms => 4s spin
        true,  // spin to center of slice
        2,     // 2 full revolutions
        1,     // clockwise direction
      );
    }
  }

  /** Is user allowed to spin right now? */
  const canSpin = (
    !isSpinning &&
    balance >= 50000 &&
    betAmount >= 10000 &&
    betAmount <= balance
  );

  /** Our pointer image at top/center. */
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

  /** Hide confetti after playing once. */
  const handleCongratsAnimationEnd = () => {
    setShowCongratsGif(false);
  };

  return (
    <Animate>
      <div className="grid place-items-center px-3 pt-3 pb-[90px] relative">
        {/* Top: show user’s total (balance + refBonus) */}
        <div className="text-white mb-2 text-center">
          Balance: {formatNumber(totalBalance)} Mianus
        </div>

        <div className="bg-activebg border border-activeborder rounded-lg w-full max-w-[420px] shadow-lg p-4">
          <h2 className="text-white slackey-regular text-[20px] font-medium text-center mb-2">
            Spin Mianus
          </h2>

          {/* Bet Input & Spin Button */}
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

          {/* Warnings */}
          <div className="mt-2 text-sm text-red-400 min-h-[20px]">
            {balance < 50000 && <p>You need ≥ 50,000 Mianus to play.</p>}
            {betAmount < 10000 && <p>Min bet 10,000 Mianus.</p>}
            {betAmount > balance && <p>Bet cannot exceed your balance.</p>}
          </div>

          {/* The actual wheel container */}
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
            {/* The pointer overlay */}
            {renderPointer()}
          </div>
        </div>

        {/* ephemeral floating text (like +10,000 or -10,000) */}
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

        {/* Toastlike "You lost" or "You won" message */}
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

        {/* Confetti GIF if user wins */}
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
