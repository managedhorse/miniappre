import React, { useState, useEffect, useRef } from "react";
import { Wheel } from "spin-wheel";                 // spin-wheel library
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";                   // Adjust to your path
import { useUser } from "../context/userContext";
import { IoCheckmarkCircle, IoCloseCircle } from "react-icons/io5";
import pointerImage from "../images/pointer.webp";  // pointer image
import congratspic from "../images/celebrate.gif";
import Animate from "../Components/Animate";

/** A small helper to format big numbers with commas. */
function formatNumber(num) {
  return num.toLocaleString("en-US");
}

/** Weighted approach ~60 slices:
 *   41.7% => Lose
 *   40.0% => 1.2×
 *    6.7% => 1.5×
 *   10.0% => 3×
 *    1.7% => 10×
 */
const baseSlices = [
  ...Array(25).fill({ label: "Lose", multiplier: 0, color: "#D30000" }),
  ...Array(24).fill({ label: "1.2×", multiplier: 1.2, color: "#FFD700" }),
  ...Array(4).fill({ label: "1.5×", multiplier: 1.5, color: "#FFA500" }),
  ...Array(6).fill({ label: "3×",   multiplier: 3,   color: "#1E90FF" }),
  ...Array(1).fill({ label: "10×",  multiplier: 10,  color: "#800080" }),
];

function shuffleArray(arr) {
  const clone = [...arr];
  for (let i = clone.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

/** Convert slices => spin-wheel items. We'll store multiplier in .value. */
function createWheelItems() {
  const shuffled = shuffleArray(baseSlices);
  return shuffled.map((slice) => ({
    label: slice.label,
    backgroundColor: slice.color,
    value: { multiplier: slice.multiplier },
    // smaller label font =>  itemLabelFontSizeMax
    // but we can also globally set wheel itemLabelFontSizeMax in props.
    // weight: 1 by default
  }));
}

export default function LuckyWheel() {
  const { balance, refBonus, setBalance, id } = useUser();
  // Create a ref to keep track of the current balance
  const currentBalanceRef = useRef(balance);
  
  // Update the ref whenever balance changes
  useEffect(() => {
    currentBalanceRef.current = balance;
  }, [balance]);
  const totalBalance = balance + refBonus;

  /** Generate items array once, so it doesn't shuffle on each render. */
  const [items] = useState(createWheelItems);

  /** We'll store references to the container and the wheel instance. */
  const containerRef = useRef(null);
  const wheelRef = useRef(null);

  /** Various UI states. */
  const [betAmount, setBetAmount] = useState(10000);
  const [isSpinning, setIsSpinning] = useState(false);

  const [floatingText, setFloatingText] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [showCongratsGif, setShowCongratsGif] = useState(false);

  /** On first mount, create the spin-wheel. */
  useEffect(() => {
    if (!containerRef.current) return;

    wheelRef.current = new Wheel(containerRef.current, {
      // items for the wheel
      items,
      // bigger container => we want the wheel’s radius to scale
      radius: 0.9,
      // lines & borders
      lineColor: "#000",
      lineWidth: 1,
      borderColor: "#000",
      borderWidth: 2,
      // pointer at top
      pointerAngle: 0,
      // slow down factor
      rotationResistance: -35,
      // smaller labels
      itemLabelFontSizeMax: 14, // reduce from default 100 => about 14px at 500px container
      // itemLabelRadius => 0.85 by default, or you can tweak:
      // itemLabelRadius: 0.75,
      // callback after spin
      onRest: handleWheelRest,
    });

    // remove on unmount
    return () => {
      if (wheelRef.current) {
        wheelRef.current.remove();
        wheelRef.current = null;
      }
    };
  }, [items]);

  function handleWheelRest(e) {
    setIsSpinning(false);
  
    const winIndex = e.currentIndex; 
    if (winIndex == null) return;
  
    const winningItem = items[winIndex];
    const { multiplier } = winningItem.value || {};
  
    if (!multiplier) {
      // Lost case
      setResultMessage(`You lost your bet of ${formatNumber(betAmount)} Mianus!`);
      setFloatingText(`-${formatNumber(betAmount)}`);
      setTimeout(() => setFloatingText(""), 2000);
    } else {
      // Win case: Calculate winnings using the up-to-date balance from the ref
      const totalReturn = Math.floor(multiplier * betAmount);
      const netGain = totalReturn - betAmount;
      const newBal = currentBalanceRef.current + netGain;  // Use the ref here
  
      // Update the user document and local state
      updateDoc(doc(db, "telegramUsers", id), { balance: newBal }).catch(console.error);
      setBalance(newBal);
  
      setResultMessage(`Congratulations! You won × ${multiplier}!`);
      setFloatingText(`+${formatNumber(totalReturn)}`);
      setShowCongratsGif(true);
      setTimeout(() => setFloatingText(""), 2000);
    }
  
    setShowResult(true);
    setTimeout(() => setShowResult(false), 5000);
  }

  /** Subtract bet, pick random item, spin => spinToItem(...) */
  async function handleSpin() {
    if (isSpinning) return;
    if (balance < 50000) return;
    if (betAmount < 10000) return;
    if (betAmount > balance) return;

    // subtract bet
    const newBal = balance - betAmount;
    try {
      await updateDoc(doc(db, "telegramUsers", id), { balance: newBal });
      setBalance(newBal);
    } catch (err) {
      console.error("Error subtracting bet:", err);
      return;
    }

    // spin
    setIsSpinning(true);
    const randomIdx = Math.floor(Math.random() * items.length);

    // spinToItem(itemIndex, durationMs, spinToCenter, revolutions, direction)
    if (wheelRef.current) {
      wheelRef.current.spinToItem(
        randomIdx,
        4000,   // 4s spin
        true,   // center on the item
        2,      // revolve 2 times
        1       // 1 => clockwise
      );
    }
  }

  /** For the pointer image at the top center. We'll absolutely position it. */
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

  /** Hide confetti after it animates once. */
  const handleCongratsAnimationEnd = () => {
    setShowCongratsGif(false);
  };

  const canSpin = !isSpinning && balance >= 50000 && betAmount >= 10000 && betAmount <= balance;

  return (
    <Animate>
      <div className="grid place-items-center px-3 pt-3 pb-[90px] relative">
        {/* Show user’s total balance */}
        <div className="text-white mb-2 text-center">
          Balance: {formatNumber(totalBalance)} Mianus
        </div>

        <div className="bg-activebg border border-activeborder rounded-lg w-full max-w-[420px] shadow-lg p-4">
          <h2 className="text-white slackey-regular text-[18px] font-medium text-center mb-3">
            Spin-Wheel
          </h2>

          {/* Bet input & Spin button */}
          <div className="flex items-center space-x-2 mb-2">
            <input
              type="number"
              placeholder="Enter bet (≥10,000)"
              className="flex-1 py-1 px-2 rounded-md 
                         bg-white text-black border border-gray-300
                         focus:outline-none focus:border-blue-500"
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
            />
            <button
              onClick={handleSpin}
              disabled={!canSpin}
              className={`px-4 py-2 text-white rounded-md font-semibold
                          ${
                            canSpin
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-gray-500 cursor-not-allowed"
                          }`}
            >
              Spin
            </button>
          </div>

          {/* Validation messages */}
          <div className="text-red-400 text-sm min-h-[20px]">
            {balance < 50000 && <p>Need ≥ 50,000 to play.</p>}
            {betAmount < 10000 && <p>Minimum bet is 10,000.</p>}
            {betAmount > balance && <p>Bet cannot exceed your balance.</p>}
          </div>

          {/* The container for the spinning wheel */}
          <div
            className="relative mx-auto mt-3"
            style={{
              // 80vw + maxWidth=420 => ensures mobile not cut off:
              width: "80vw",
              height: "80vw",
              maxWidth: "360px",
              maxHeight: "360px",
              overflow: "hidden", // hide any partial
            }}
          >
            {/* spin-wheel goes here */}
            <div
              ref={containerRef}
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                margin: "0 auto",
              }}
            />
            {/* pointer image absolutely positioned at top center */}
            {renderPointer()}
          </div>
        </div>

        {/* ephemeral floating text (like +12,000) */}
        {floatingText && (
          <div
            className="absolute flex justify-center items-center 
                       top-1/2 left-1/2 
                       transform -translate-x-1/2 -translate-y-1/2
                       pointer-events-none"
          >
            <div className="bg-black/60 text-white px-3 py-1 rounded-md animate-bounce">
              {floatingText}
            </div>
          </div>
        )}

        {/* Toastlike message at bottom */}
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

        {/* Congrats confetti image */}
        {showCongratsGif && !resultMessage.includes("lost") && (
          <div
            className="absolute top-[20%] left-0 right-0 flex justify-center
                       pointer-events-none select-none"
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
