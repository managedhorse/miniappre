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
// ← new import:
import { makeWheelItems } from "../Components/WheelConfig";

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


export default function LuckyWheel() {
  const { balance, refBonus, setBalance, id, loading, initialized } = useUser();
  const userIsReady = Boolean(id && initialized && !loading);
  const totalBalance = balance + refBonus;

  // Bet state (unchanged)…
  const [betAmount, setBetAmount] = useState("");
  const numericBet = parseInt(betAmount, 10) || 0;

  // ** NEW: difficulty selector **
  const [difficulty, setDifficulty] = useState("hard"); // default
  // ** NEW: build items from your config **
  const [items, setItems] = useState(() => makeWheelItems(difficulty));

  // update items whenever difficulty changes
  useEffect(() => {
    setItems(makeWheelItems(difficulty));
  }, [difficulty]);

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

  // initialize wheel with `items`
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
      {/* full-screen wrapper */}
      <div className="relative w-full h-screen">
        {/* grass background */}
        <div
          className="fixed inset-0 bg-top bg-no-repeat"
          style={{
            backgroundImage: `url(${grassBg})`,
            backgroundSize: "130% auto",
          }}
        />

        {/* scrollable UI */}
        <div className="absolute inset-0 overflow-y-auto flex flex-col items-center pt-6 pb-6">
          {/* Balance display */}
          <div className="mb-4 text-center">
            <span className="slackey-regular text-[22px] text-white">
              Balance:{" "}
            </span>
            <span className="slackey-regular text-[22px] text-yellow-300">
              {formatNumber(totalBalance)} Mianus
            </span>
          </div>

          {/* Difficulty tabs */}
<div className="mb-4 flex items-center">
  <span className="slackey-regular text-white mr-2">Difficulty:</span>
  <div className="inline-flex bg-gray-800 rounded-xl border-2 border-yellow-500 overflow-hidden">
    {[
      { key: "easy",   label: "3×" },
      { key: "medium", label: "10×" },
      { key: "hard",   label: "50×" },
    ].map(({ key, label }) => (
      <button
        key={key}
        type="button"
        onClick={() => setDifficulty(key)}
        className={`
          px-3 py-1 text-sm font-bold
          ${difficulty === key
            ? "bg-yellow-400 text-gray-900"
            : "text-yellow-300 hover:bg-gray-700"}
          focus:outline-none
        `}
      >
        {label}
      </button>
    ))}
  </div>
</div>


          {/* Bet input + controls (unchanged) */}
          <div className="w-4/5 max-w-sm mb-4 mr-5 ml-5">
            <div className="relative flex items-center">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-yellow-400 text-lg">
                💰
              </span>
              <input
               type="number"
                placeholder="Min Bet 10,000"
               
                className={`
     w-full pl-5 pr-20 py-2
     rounded-xl bg-gradient-to-br from-gray-800 to-gray-900
     text-yellow-300 font-bold text-lg placeholder-yellow-600
     border-2 ${isTooLow || isTooHigh ? 'border-red-500' : 'border-yellow-500'}
     focus:outline-none ${isTooLow || isTooHigh
       ? 'focus:border-red-400 focus:ring-red-400'
       : 'focus:border-yellow-400 focus:ring-yellow-400'}
     shadow-[0_0_10px_rgba(255,215,0,0.7)]
     transition-transform transform hover:scale-105
   `}
                value={betAmount}
                onChange={(e) => {
              // Let them type anything; we'll show an error if it's out of range
              // strip out any non-digits so leading zeros, etc. don’t confuse parseInt
              const raw = e.target.value.replace(/\D/g, "");
              setBetAmount(raw);
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
            {/* reserve a 20px-high slot for error text */}
<div className="mt-1 h-[20px] text-center">
  {isTooLow && (
    <p className="text-sm text-red-400">Minimum bet is 10,000</p>
  )}
  {isTooHigh && (
    <p className="text-sm text-red-400">
      You only have {formatNumber(totalBalance)} Mianus
    </p>
  )}
</div>
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
