import React, { useState, useEffect, useRef } from "react";
import { Wheel } from "spin-wheel";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useUser } from "../context/userContext";
import { IoCheckmarkCircle, IoCloseCircle } from "react-icons/io5";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import pointerImage from "../images/pointer.webp";
import grassBg from "../images/grassbg.webp";
import congratspic from "../images/celebrate.gif";
import Animate from "../Components/Animate";

/** Helper to format 1234 → "1,234" */
function formatNumber(num) {
  return num.toLocaleString("en-US");
}

/** Plunger component with a vertical track and circular knob */
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
      <div className="relative w-8" style={{ height: trackHeight }}>
        {/* Track */}
        <div className="absolute inset-x-0 mx-auto w-2 h-full bg-gray-600 rounded-full" />
        {/* Knob */}
        <motion.div
          style={{ y }}
          className={`absolute left-0 w-8 h-8 rounded-full ${
            disabled ? "bg-gray-400" : "bg-pink-500"
          }`}
          drag="y"
          dragConstraints={{ top: 0, bottom: maxY }}
          onDragEnd={handleDragEnd}
          whileTap={{ cursor: disabled ? "not-allowed" : "grabbing" }}
        />
      </div>
      <span className="slackey-regular text-white mt-2 text-xs">Pull to spin</span>
    </div>
  );
}

/** Weighted slices with new 50× jackpot */
const baseSlices = [
  ...Array(63).fill({ label: "Lose", multiplier: 0, color: "#F8AAFF" }),
  ...Array(24).fill({ label: "1.2×", multiplier: 1.2, color: "#4ADE80" }),
  ...Array(4).fill({ label: "1.5×", multiplier: 1.5, color: "#FACC15" }),
  ...Array(6).fill({ label: "3×",   multiplier: 3,   color: "#F472B6" }),
  ...Array(1).fill({ label: "50×",  multiplier: 50,  color: "#A78BFA" }),
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
  return shuffleArray(baseSlices).map(slice => ({
    label: slice.label,
    backgroundColor: slice.color,
    color: slice.multiplier === 0 ? "#FFFFFF" : "#000000",
    value: { multiplier: slice.multiplier },
  }));
}

export default function LuckyWheel() {
  const [power, setPower] = useState(0);
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

  // Keep a ref of the latest balance
  const balanceRef = useRef(balance);
  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);

  // Store the stake for onRest
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
      itemLabelRadius: 0.95,
    });
    setWheelReady(true);
    return () => {
      setWheelReady(false);
      wheelRef.current?.remove();
      wheelRef.current = null;
    };
  }, [items]);

  // Single consolidated balance update
  async function handleWheelRest(e) {
    setIsSpinning(false);
    const idx = typeof e.currentIndex === "number"
      ? e.currentIndex
      : typeof e.index === "number"
      ? e.index
      : null;
    if (idx === null) return;

    const curBal  = balanceRef.current;
    const betUsed = betRef.current;
    const { multiplier } = items[idx].value || {};

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
      console.error("Error updating balance after spin:", err);
    }

    setTimeout(() => setFloatingText(""), 2500);
    setShowResult(true);
    setTimeout(() => setShowResult(false), 5000);
  }

  // Fire the spin from plunger
  function handleSpinWithPower(pwr) {
    if (!wheelReady || !userIsReady || isSpinning) return;
    if (totalBalance < 50000) return;
    if (numericBet < 10000 || numericBet > totalBalance) return;

    setIsSpinning(true);
    betRef.current = numericBet;

    const minDur = 2000, maxDur = 8000;
    const minRevs = 1,    maxRevs = 5;
    const duration    = minDur + ((maxDur - minDur) * pwr) / 100;
    const revolutions = minRevs + ((maxRevs - minRevs) * pwr) / 100;

    const randomIndex = Math.floor(Math.random() * items.length);
    wheelRef.current.spinToItem(randomIndex, duration, true, revolutions, 1);
  }

  const canSpin =
    !isSpinning &&
    wheelReady &&
    userIsReady &&
    totalBalance >= 50000 &&
    numericBet >= 10000 &&
    numericBet <= totalBalance;

  // Pointer arrow always centred
  const renderPointer = () => (
    <img
      src={pointerImage}
      alt="pointer"
      style={{
        position: "absolute",
        top: "-15px",
        left: 0,
        right: 0,
        margin: "0 auto",
        transform: "rotate(-45deg)",
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
      {/* Full-screen grass BG */}
      <div
        className="w-full h-screen overflow-auto bg-cover bg-center flex flex-col items-center pt-6 pb-6"
        style={{ backgroundImage: `url(${grassBg})` }}
      >
        {/* Balance display */}
        <div className="mb-4 text-center">
          <span className="slackey-regular text-[26px] text-white">
            Balance:{" "}
          </span>
          <span className="slackey-regular text-[26px] text-yellow-300">
            {formatNumber(totalBalance)} Mianus
          </span>
        </div>

        {/* Bet input */}
        <div className="w-11/12 max-w-sm mb-4">
          <input
            type="number"
            placeholder="Enter amount"
            className="w-full py-2 px-3 rounded-md bg-white text-black border border-gray-300 focus:outline-none focus:border-blue-500"
            value={betAmount}
            onChange={e => setBetAmount(e.target.value)}
          />
          <div className="mt-1 text-sm text-red-400 min-h-[1em]">
            {(!wheelReady || !userIsReady) && <p>Please wait...</p>}
            {totalBalance < 50000 && <p>You need ≥ 50,000 Mianus to play.</p>}
            {numericBet < 10000 && <p>Minimum bet is 10,000 Mianus.</p>}
            {numericBet > totalBalance && <p>Bet cannot exceed your balance.</p>}
          </div>
        </div>

        {/* Wheel + Plunger */}
        <div className="flex items-start justify-center space-x-2 flex-wrap">
          {/* Wheel */}
          <div
            className="relative"
            style={{
              width: "75vw",
              height: "75vw",
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

          {/* Plunger */}
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
          <div className="fixed inset-x-0 bottom-6 flex justify-center px-4 z-50">
            <div
              className={`flex items-center space-x-2 px-4 py-2 bg-[#121620ef] rounded-lg shadow-lg text-sm w-fit ${
                resultMessage.includes("lost") ? "text-red-400" : "text-green-300"
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

        {/* Congrats GIF */}
        {showCongratsGif && (
          <div className="absolute top-1/4 inset-x-0 flex justify-center pointer-events-none select-none">
            <img src={congratspic} alt="congrats" className="w-40" />
          </div>
        )}
      </div>
    </Animate>
  );
}
