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

/** Weighted slices with new 50× jackpot and preserving EV */
const baseSlices = [
  // 63 Lose slices (0×)
  ...Array(63).fill({ label: "Lose", multiplier: 0, color: "#2D2D2D" }),

  // 24 slices at 1.2×
  ...Array(24).fill({ label: "1.2×", multiplier: 1.2, color: "#4ADE80" }),

  // 4 slices at 1.5×
  ...Array(4).fill({ label: "1.5×", multiplier: 1.5, color: "#FACC15" }),

  // 6 slices at 3×
  ...Array(6).fill({ label: "3×", multiplier: 3, color: "#F472B6" }),

  // 1 slice at 50× jackpot
  ...Array(1).fill({ label: "50×", multiplier: 50, color: "#A78BFA" }),
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
  return shuffleArray(baseSlices).map((slice) => ({
    label: slice.label,
    backgroundColor: slice.color,
    color: slice.multiplier === 0 ? "#FFFFFF" : "#000000", // white on dark “Lose”
    value: { multiplier: slice.multiplier },
  }));
}

export default function LuckyWheel() {
  const { balance, refBonus, setBalance, id, loading, initialized } = useUser();
  const userIsReady = Boolean(id && initialized && !loading);
  const totalBalance = balance + refBonus;

  // STORE raw string so placeholder shows; parse below
  const [betAmount, setBetAmount] = useState("");
  const numericBet = parseInt(betAmount, 10) || 0;

  const [items] = useState(createWheelItems);
  const containerRef = useRef(null);
  const wheelRef = useRef(null);

  const [isSpinning, setIsSpinning] = useState(false);
  const [floatingText, setFloatingText] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [showCongratsGif, setShowCongratsGif] = useState(false);

  // Keep a ref of the latest balance for async callbacks
  const balanceRef = useRef(balance);
  useEffect(() => { balanceRef.current = balance; }, [balance]);

  // Store the bet we used so we can reference it onRest
  const betRef = useRef(0);

  // Initialize the wheel
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
      isInteractive: false,
      onRest: handleWheelRest,
    });
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
    // support both spin-wheel versions
    const idx =
      typeof e.currentIndex === "number"
        ? e.currentIndex
        : typeof e.index === "number"
        ? e.index
        : null;
    if (idx === null) {
      console.warn("Wheel stopped but no index provided:", e);
      return;
    }

    const curBalance = balanceRef.current;
    const betUsed = betRef.current;
    const { multiplier } = items[idx].value || {};

    if (!multiplier) {
      // lose
      setResultMessage(`You lost your bet of ${formatNumber(betUsed)} Mianus!`);
      setFloatingText(`-${formatNumber(betUsed)}`);
    } else {
      // win
      const winnings = Math.floor(betUsed * multiplier);
      const newBal = curBalance + winnings;
      updateDoc(doc(db, "telegramUsers", id), { balance: newBal }).catch(console.error);
      setBalance(newBal);
      balanceRef.current = newBal;

      setResultMessage(`Congratulations! You won ×${multiplier}!`);
      setFloatingText(`+${formatNumber(winnings)}`);
      setShowCongratsGif(true);
      setTimeout(() => setShowCongratsGif(false), 3000);
    }

    setTimeout(() => setFloatingText(""), 2500);
    setShowResult(true);
    setTimeout(() => setShowResult(false), 5000);
  }

  async function handleSpin() {
    if (!wheelReady || !userIsReady || isSpinning) return;
    if (totalBalance < 50000) return;
    if (numericBet < 10000 || numericBet > totalBalance) return;

    setIsSpinning(true);
    const newBal = totalBalance - numericBet;
    try {
      await updateDoc(doc(db, "telegramUsers", id), { balance: newBal });
      setBalance(newBal);
      balanceRef.current = newBal;
    } catch (err) {
      console.error("Error subtracting bet:", err);
      setIsSpinning(false);
      return;
    }

    betRef.current = numericBet;
    const randomIndex = Math.floor(Math.random() * items.length);
    wheelRef.current.spinToItem(randomIndex, 4000, true, 2, 1);
  }

  const canSpin =
    !isSpinning &&
    wheelReady &&
    userIsReady &&
    totalBalance >= 50000 &&
    numericBet >= 10000 &&
    numericBet <= totalBalance;

  // Pointer arrow over the wheel
  const renderPointer = () => (
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

  // Telegram back button
  useEffect(() => {
    window.Telegram.WebApp.BackButton.show();
    const onBack = () => window.history.back();
    window.Telegram.WebApp.BackButton.onClick(onBack);
    return () => {
      window.Telegram.WebApp.BackButton.offClick(onBack);
      window.Telegram.WebApp.BackButton.hide();
    };
  }, []);

  return (
    <Animate>
      <div className="grid place-items-center px-3 pt-3 pb-[90px] relative">
        <div className="text-white mb-2 text-center">
          Balance: {formatNumber(totalBalance)} Mianus
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg w-full max-w-[420px] shadow-lg p-4">
          <h2 className="text-white slackey-regular text-[20px] font-medium text-center mb-2">
            Spin Mianus
          </h2>

          <div className="flex items-center space-x-2 w-full">
            <input
              type="number"
              placeholder="Enter amount"
              className="flex-1 py-1 px-2 rounded-md bg-white text-black border border-gray-300 focus:outline-none focus:border-blue-500"
              value={betAmount}
              onChange={e => setBetAmount(e.target.value)}
            />
            <button
              onClick={handleSpin}
              disabled={!canSpin}
              className={`px-4 py-2 text-white rounded-md font-semibold transition-colors duration-300 ${
                canSpin ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-500 cursor-not-allowed"
              }`}
            >
              Spin
            </button>
          </div>

          <div className="mt-2 text-sm text-red-400 min-h-[20px]">
            {(!wheelReady || !userIsReady) && <p>Please wait...</p>}
            {totalBalance < 50000 && <p>You need ≥ 50,000 Mianus to play.</p>}
            {numericBet < 10000 && <p>Minimum bet is 10,000 Mianus.</p>}
            {numericBet > totalBalance && <p>Bet cannot exceed your balance.</p>}
          </div>

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
                overflow: "hidden",
              }}
            />
            {renderPointer()}
          </div>
        </div>

        {floatingText && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/60 text-white px-3 py-1 rounded-md animate-bounce">
              {floatingText}
            </div>
          </div>
        )}

        {showResult && (
          <div className="fixed left-0 right-0 bottom-[80px] mx-auto flex justify-center px-4 z-[9999]">
            <div
              className={`flex items-center space-x-2 px-4 py-2 bg-[#121620ef] rounded-[8px] shadow-lg text-sm w-fit ${
                resultMessage.includes("lost") ? "text-red-400" : "text-[#54d192]"
              }`}
            >
              {resultMessage.includes("lost") ? (
                <IoCloseCircle size={24} />
              ) : (
                <IoCheckmarkCircle size={24} />
              )}
              <span className="font-medium slackey-regular">{resultMessage}</span>
            </div>
          </div>
        )}

        {showCongratsGif && (
          <div className="absolute top-[20%] left-0 right-0 flex justify-center pointer-events-none select-none">
            <img src={congratspic} alt="congrats" className="w-[160px]" />
          </div>
        )}
      </div>
    </Animate>
  );
}
