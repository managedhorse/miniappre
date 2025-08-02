import React, { useState, useEffect, useRef } from "react";
import { Wheel } from "spin-wheel";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useUser } from "../context/userContext";
import { IoCheckmarkCircle, IoCloseCircle } from "react-icons/io5";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import pointerImage from "../images/pointer.webp";
import pullerImage from "../images/puller.webp";
import grassBg from "../images/grassbg.webp";
import congratspic from "../images/celebrate.gif";
import Animate from "../Components/Animate";

/** Helper to format 1234 → "1,234" */
function formatNumber(num) {
  return num.toLocaleString("en-US");
}

/** Plunger component with a vertical track and image knob */
function Plunger({ onPull, disabled }) {
  const trackHeight = 200;
  const knobSize = 32;
  const maxY = trackHeight - knobSize;

  const y = useMotionValue(0);
  const power = useTransform(y, [0, maxY], [0, 100]);

  function handleDragEnd() {
    if (!disabled) {
      const p = Math.round(power.get());
      onPull(p);
    }
    animate(y, 0, { type: "spring", stiffness: 500, damping: 30 });
  }

  return (
    <div className="flex flex-col items-center select-none">
      <span className="slackey-regular text-white mb-1 text-xs">Pull to spin</span>
      <div className="relative" style={{ width: knobSize, height: trackHeight }}>
        <div className="absolute inset-x-0 mx-auto w-2 h-full bg-gray-600 rounded-full" />
        <motion.img
          src={pullerImage}
          alt="knob"
          className="absolute left-0 w-8 h-8"
          style={{ y, filter: disabled ? "grayscale(100%)" : "none" }}
          drag="y"
          dragConstraints={{ top: 0, bottom: maxY }}
          onDragEnd={handleDragEnd}
          whileTap={{ cursor: disabled ? "not-allowed" : "grabbing" }}
        />
      </div>
    </div>
  );
}

/** Weighted slices with new 50× jackpot */
const baseSlices = [
  ...Array(63).fill({ label: "Lose", multiplier: 0, color: "#F8AAFF" }),
  ...Array(24).fill({ label: "1.2×", multiplier: 1.2, color: "#4ADE80" }),
  ...Array(4).fill({ label: "1.5×", multiplier: 1.5, color: "#FACC15" }),
  ...Array(6).fill({ label: "3×", multiplier: 3, color: "#F472B6" }),
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
    color: slice.multiplier === 0 ? "#FFFFFF" : "#000000",
    value: { multiplier: slice.multiplier },
  }));
}

export default function LuckyWheel() {
  const { balance, refBonus, setBalance, id, loading, initialized } = useUser();
  const userIsReady = Boolean(id && initialized && !loading);
  const totalBalance = balance + refBonus;

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

  const balanceRef = useRef(balance);
  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);
  const betRef = useRef(0);

  // helpers to double or half the current bet
  const handleDouble = () => {
   const current = parseInt(betAmount, 10) || 0;
   // don't allow doubling past your balance
   const doubled = current * 2;
   setBetAmount(String(Math.min(doubled, totalBalance)));
 };
  const handleHalf = () => {
    const current = parseInt(betAmount, 10) || 0;
    setBetAmount(String(Math.floor(current / 2)));
  };

  // initialize wheel
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
      itemLabelRadius: 0.95,
    });
    return () => {
      wheelRef.current?.remove();
      wheelRef.current = null;
    };
  }, [items]);

  async function handleWheelRest(e) {
    setIsSpinning(false);
    const idx =
      typeof e.currentIndex === "number"
        ? e.currentIndex
        : typeof e.index === "number"
        ? e.index
        : null;
    if (idx === null) return;

    const curBal = balanceRef.current;
    const betUsed = betRef.current;
    const { multiplier } = items[idx].value;
    let newBal;

    if (!multiplier) {
      newBal = curBal - betUsed;
      setResultMessage(`You lost your bet of ${formatNumber(betUsed)} Mianus!`);
      setFloatingText(`-${formatNumber(betUsed)}`);
    } else {
      const winnings = Math.floor(betUsed * multiplier);
      newBal = curBal + winnings;
      setResultMessage(`Congratulations! You won ×${multiplier}!`);
      setFloatingText(`+${formatNumber(winnings)}`);
      setShowCongratsGif(true);
      setTimeout(() => setShowCongratsGif(false), 3000);
    }

    try {
      await updateDoc(doc(db, "telegramUsers", id), { balance: newBal });
      setBalance(newBal);
      balanceRef.current = newBal;
    } catch (err) {
      console.error("Update failed:", err);
    }

    setTimeout(() => setFloatingText(""), 2500);
    setShowResult(true);
    setTimeout(() => setShowResult(false), 5000);
  }

  function handleSpinWithPower(pwr) {
    if (!userIsReady || isSpinning) return;
    if (numericBet < 10000 || numericBet > totalBalance) return;

    setIsSpinning(true);
    betRef.current = numericBet;

    const duration = 2000 + (6000 * pwr) / 100;
    const revolutions = 1 + (4 * pwr) / 100;
    const idx = Math.floor(Math.random() * items.length);
    wheelRef.current.spinToItem(idx, duration, true, revolutions, 1);
  }

  const canSpin =
    !isSpinning && numericBet >= 10000 && numericBet <= totalBalance;

const isTooLow  = numericBet > 0 && numericBet < 10000;
const isTooHigh = numericBet > totalBalance;
const isValid   = !isTooLow && !isTooHigh && numericBet > 0;

  const renderPointer = () => (
    <img
      src={pointerImage}
      alt="pointer"
      style={{
        position: "absolute",
        top: "-25px",
        left: 0,
        right: 0,
        margin: "0 auto",
        transform: "translateX(-1px) rotate(-45deg)",
        width: "40px",
        zIndex: 1000,
      }}
    />
  );

  useEffect(() => {
    window.Telegram.WebApp.BackButton.show();
    const onBack = () => window.history.back();
    window.Telegram.WebApp.BackButton.onClick(onBack);
    return () => window.Telegram.WebApp.BackButton.hide();
  }, []);

  return (
    <Animate>
      {/* outer wrapper */}
      <div className="relative w-full h-screen">
        {/* pinned grass background */}
        <div
   className="fixed inset-0 bg-top bg-no-repeat"
   style={{
     backgroundImage: `url(${grassBg})`,
     backgroundSize: '130% auto'
   }}
 />

        {/* scrollable game UI */}
        <div className="absolute inset-0 overflow-y-auto flex flex-col items-center pt-6 pb-6">
          {/* Balance */}
          <div className="mb-4 text-center">
            <span className="slackey-regular text-[22px] text-white">
              Balance:{" "}
            </span>
            <span className="slackey-regular text-[22px] text-yellow-300">
              {formatNumber(totalBalance)} Mianus
            </span>
          </div>

          {/* Bet input */}
          <div className="w-4/5 max-w-sm mb-4 mr-5 ml-5">
            <div className="relative flex items-center">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-yellow-400 text-lg">
                💰
              </span>
              <input
               type="number"
                placeholder="Min Bet 10,000"
                min="10000"
                max={totalBalance}                           /* ① HTML-level max */
                className="w-full pl-5 pr-20 py-2 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 text-yellow-300 font-bold text-lg placeholder-yellow-600 border-2 ${isTooLow || isTooHigh ? 'border-red-500' : 'border-yellow-500'} focus:outline-none focus:${isTooLow||isTooHigh ? 'border-red-400 ring-red-400' : 'border-yellow-400 ring-yellow-400'} shadow-[0_0_10px_rgba(255,215,0,0.7)] transition-transform transform hover:scale-105"
                value={betAmount}
                onChange={(e) => {
                  const raw = parseInt(e.target.value, 10) || 0;
                  // ② clamp between your floor (10k) and your totalBalance
                  const clamped = Math.min(raw, totalBalance);
                  setBetAmount(String(clamped));
                }}
              />

              {/* double/half controls */}
              <div className="absolute right-3 flex space-x-2">
                <button
                  type="button"
                  onClick={handleHalf}
                  className="px-2 py-1 bg-gray-700 text-white rounded-md text-sm"
                >
                  ½
                </button>
                <button
                  type="button"
                  onClick={handleDouble}
                  className="px-2 py-1 bg-gray-700 text-white rounded-md text-sm"
                >
                  2×
                </button>
              </div>
              
            </div>
            {/* error message */}
{isTooLow && (
  <p className="mt-1 text-sm text-red-400">Minimum bet is 10,000</p>
)}
{isTooHigh && (
  <p className="mt-1 text-sm text-red-400">
    You only have {formatNumber(totalBalance)} Mianus
  </p>
)}
          </div>

          {/* Wheel + Plunger */}
          <div className="flex items-start justify-start space-x-1 mt-[40px]">
            <div
              className="relative mr-1"
              style={{
                width: "80vw",
                height: "80vw",
                maxWidth: 360,
                maxHeight: 360,
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
            <Plunger onPull={handleSpinWithPower} disabled={!canSpin} />
          </div>

          {/* Floating text */}
          {floatingText && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/60 text-white px-3 py-1 rounded-md animate-bounce">
                {floatingText}
              </div>
            </div>
          )}

          {/* Result toast */}
          {showResult && (
            <div className="absolute inset-x-0 bottom-[96px] flex justify-center px-4 z-50">
              <div
                className={`flex items-center space-x-2 px-4 py-2 bg-[#121620ef] rounded-lg shadow-lg text-sm ${
                  resultMessage.includes("lost")
                    ? "text-red-400"
                    : "text-green-300"
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

          {/* Congrats GIF */}
          {showCongratsGif && (
            <div className="absolute top-1/4 inset-x-0 flex justify-center pointer-events-none select-none">
              <img src={congratspic} alt="congrats" className="w-40" />
            </div>
          )}
        </div>
      </div>
    </Animate>
  );
}
