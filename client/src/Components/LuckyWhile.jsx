import React, { useEffect, useRef, useState } from "react"
import { Wheel } from "spin-wheel"             // from spin-wheel
import { doc, updateDoc } from "firebase/firestore"
import { db } from "../firebase"              // Adjust your import
import { useUser } from "../context/userContext"
import { IoCheckmarkCircle, IoCloseCircle } from "react-icons/io5"
import Animate from "../Components/Animate"
import congratspic from "../images/celebrate.gif"

/** A small helper to format big numbers with commas. */
function formatNumber(num) {
  return num.toLocaleString("en-US");
}

/** Weighted approach ~60 slices for distribution. Adjust if you like fewer slices. */
const baseSlices = [
  // 25 => Lose => ~41.7%
  ...Array(25).fill({ label: "Lose", multiplier: 0, color: "#D30000" }),
  // 24 => 1.2× => ~40.0%
  ...Array(24).fill({ label: "1.2×", multiplier: 1.2, color: "#FFD700" }),
  // 4 => 1.5× => ~6.7%
  ...Array(4).fill({ label: "1.5×", multiplier: 1.5, color: "#FFA500" }),
  // 6 => 3× => ~10.0%
  ...Array(6).fill({ label: "3×",   multiplier: 3,   color: "#1E90FF" }),
  // 1 => 10× => ~1.7%
  ...Array(1).fill({ label: "10×",  multiplier: 10,  color: "#800080" }),
];

/** Shuffle to spread slices around the wheel (so they aren’t bunched). */
function shuffleArray(arr) {
  const clone = [...arr];
  for (let i = clone.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

/**
 * Convert baseSlices => spin-wheel "items" array:
 * Each "item" can have label, backgroundColor, weight, etc.
 * We'll store 'multiplier' inside item.value so we can retrieve it on rest.
 */
function createWheelItems() {
  const shuffled = shuffleArray(baseSlices);
  // For spin-wheel, each item = { label, backgroundColor, value, weight }
  // label => text that appears
  // backgroundColor => color
  // value => anything you want to retrieve later, e.g. multiplier
  // weight => how large the slice is (1 by default)
  return shuffled.map((slice) => ({
    label: slice.label,
    backgroundColor: slice.color,
    value: { multiplier: slice.multiplier },
    weight: 1,
  }));
}

export default function LuckyWheel() {
  const { balance, refBonus, setBalance, id } = useUser();

  /** Combine user’s Mianus + refBonus. */
  const totalBalance = balance + refBonus;

  /**
   * We'll store the final "items" array once, so it doesn't shuffle again.
   * This is important, or the order changes with every render.
   */
  const [items] = useState(createWheelItems);

  /** Refs to hold the DOM container and the spin-wheel instance. */
  const containerRef = useRef(null);
  const wheelRef = useRef(null);

  /** State for bet, ephemeral text, confetti, etc. */
  const [betAmount, setBetAmount] = useState(10000); // Min bet = 10K
  const [isSpinning, setIsSpinning] = useState(false); 
  const [floatingText, setFloatingText] = useState(""); 
  const [resultMessage, setResultMessage] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [showCongratsGif, setShowCongratsGif] = useState(false);

  /** On first mount, create the spin-wheel in the container. */
  useEffect(() => {
    if (!containerRef.current) return;

    // 1) Build the Wheel instance
    wheelRef.current = new Wheel(containerRef.current, {
      items,                 // The array of items
      radius: 0.94,          // fill ~94% of container
      lineColor: "#000",     // color of lines
      lineWidth: 1,          // 1px line
      borderColor: "#000",   // outer border
      borderWidth: 2,        // 2px border
      // If you want pointerAngle = 0 (top):
      pointerAngle: 0,
      rotationResistance: -35, // default spin slowdown
      // For reading final result:
      onRest: handleWheelRest,  // called when spin stops
    });

    // 2) Make sure to remove the wheel if this component unmounts
    return () => {
      if (wheelRef.current) {
        wheelRef.current.remove();
        wheelRef.current = null;
      }
    };
  }, [items]);

  /** Called by spin-wheel’s onRest after spinning. */
  const handleWheelRest = (event) => {
    // e.g. event.currentIndex => which item
    setIsSpinning(false);

    // The item index where pointerAngle ended:
    const winningIndex = event.currentIndex;
    if (winningIndex == null) return;

    const winningItem = items[winningIndex];
    const { multiplier } = winningItem.value; // we stored it in .value.multiplier

    if (multiplier === 0) {
      // LOST
      setResultMessage(`You lost your bet of ${formatNumber(betAmount)} Mianus!`);
      setFloatingText(`-${formatNumber(betAmount)}`);
      setTimeout(() => setFloatingText(""), 2500);
    } else {
      // Win => user had bet subtracted, so netGain
      const totalReturn = Math.floor(multiplier * betAmount);
      const netGain = totalReturn - betAmount;
      const newBal = balance + netGain;

      // update Firestore, local state
      updateDoc(doc(db, "telegramUsers", id), { balance: newBal }).catch(console.error);
      setBalance(newBal);

      setResultMessage(`Congratulations! You won your bet × ${multiplier}!`);
      setFloatingText(`+${formatNumber(totalReturn)}`);
      setShowCongratsGif(true);
      setTimeout(() => setFloatingText(""), 2500);
    }

    // Show toast for 5s
    setShowResult(true);
    setTimeout(() => setShowResult(false), 5000);
  };

  /** The user pressed Spin. We pick a random slice index, spin there. */
  const handleSpin = async () => {
    if (isSpinning) return;
    if (balance < 50000) return;    // need ≥ 50k
    if (betAmount < 10000) return;  // min bet = 10k
    if (betAmount > balance) return;

    // subtract bet first
    const newBal = balance - betAmount;
    try {
      await updateDoc(doc(db, "telegramUsers", id), { balance: newBal });
      setBalance(newBal);
    } catch (err) {
      console.error("Error subtracting bet:", err);
      return;
    }

    // pick a random item
    const randomIndex = Math.floor(Math.random() * items.length);

    // Now spin the wheel => spinToItem(itemIndex, duration, spinToCenter, revolutions, direction, easing?)
    setIsSpinning(true);
    if (wheelRef.current) {
      wheelRef.current.spinToItem(
        randomIndex,
        4000,         // 4 seconds spin
        true,         // spinToCenter => lands exactly on the center
        2,            // revolve twice
        1             // 1 => clockwise
        // optional easing => e.g. "easeCubicOut"
      );
    }
  };

  /** Hide confetti after it finishes (1 iteration). */
  const handleCongratsAnimationEnd = () => {
    setShowCongratsGif(false);
  };

  /** Various logic to enable or disable spin button. */
  const canSpin = !isSpinning && balance >= 50000 && betAmount >= 10000 && betAmount <= balance;

  return (
    <Animate>
      <div className="grid grid-cols-1 place-items-center p-3 relative">
        {/* Show total balance */}
        <div className="text-white mb-2 text-center">
          Balance: {formatNumber(totalBalance)} Mianus
        </div>

        <div className="p-4 bg-activebg border border-activeborder rounded-lg w-full max-w-[420px] shadow-lg">
          {/* Title */}
          <h2 className="text-white slackey-regular text-[20px] font-medium text-center mb-2">
            Spin Mianus
          </h2>

          {/* Bet input + button */}
          <div className="flex items-center space-x-2 w-full">
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

          {/* Warnings */}
          <div className="mt-2 text-sm text-red-400 min-h-[20px]">
            {balance < 50000 && <p>You need ≥ 50,000 Mianus to play.</p>}
            {betAmount < 10000 && <p>Minimum bet is 10,000 Mianus.</p>}
            {betAmount > balance && <p>Bet cannot exceed your balance.</p>}
          </div>

          {/* The SPIN-WHEEL container => spin-wheel will auto-resize here */}
          <div className="mt-4 flex justify-center">
            <div
              ref={containerRef}
              style={{
                width: "320px",
                height: "320px",
                border: "1px dashed #ccc",
                position: "relative",
              }}
            />
          </div>
        </div>

        {/* ephemeral floating text */}
        {floatingText && (
          <div className="absolute flex justify-center items-center top-[50%] left-[50%]
                          transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="bg-black/60 text-white px-3 py-1 rounded-md animate-bounce">
              {floatingText}
            </div>
          </div>
        )}

        {/* toastlike result at bottom */}
        {showResult && (
          <div className="fixed left-0 right-0 mx-auto bottom-[80px]
                          flex justify-center z-[9999] px-4">
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

        {/* confetti */}
        {showCongratsGif && !resultMessage.includes("lost") && (
          <div className="absolute top-[10%] left-0 right-0 flex justify-center pointer-events-none select-none">
            <img
              src={congratspic}
              alt="congrats"
              className="w-[180px] animate-fade-in-once"
              onAnimationEnd={handleCongratsAnimationEnd}
            />
          </div>
        )}
      </div>
    </Animate>
  );
}