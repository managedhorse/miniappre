import React, { useState } from "react";
import { Wheel } from "react-custom-roulette";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase.jsx";
import { useUser } from "../context/userContext.jsx";
import { IoCheckmarkCircle, IoCloseCircle } from "react-icons/io5";
import congratspic from "../images/celebrate.gif";
import Animate from "../Components/Animate";

// A smaller fixed distribution
const wheelSlices = [
  {
    option: "Lose",
    multiplier: 0,
    style: { backgroundColor: "#D30000", textColor: "#ffffff" },
  },
  {
    option: "Lose",
    multiplier: 0,
    style: { backgroundColor: "#D30000" },
  },
  {
    option: "1.2×",
    multiplier: 1.2,
    style: { backgroundColor: "#004225" },
  },
  {
    option: "1.2×",
    multiplier: 1.2,
    style: { backgroundColor: "#004225" },
  },
  {
    option: "1.2×",
    multiplier: 1.2,
    style: { backgroundColor: "#004225" },
  },
  {
    option: "1.5×",
    multiplier: 1.5,
    style: { backgroundColor: "#FFA500" },
  },
  {
    option: "3×",
    multiplier: 3,
    style: { backgroundColor: "#1E90FF" },
  },
  {
    option: "10×",
    multiplier: 10,
    style: { backgroundColor: "#800080" },
  },
];

function formatNumber(num) {
  return num.toLocaleString("en-US");
}

const LuckyWheel = () => {
  const { balance, refBonus, setBalance, id } = useUser();

  // Basic state
  const [betAmount, setBetAmount] = useState(10000);
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeIndex, setPrizeIndex] = useState(0);

  // UI feedback state
  const [floatingText, setFloatingText] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [showCongratsGif, setShowCongratsGif] = useState(false);

  const totalBalance = balance + refBonus;

  // Called when wheel stops spinning
  const onStopSpinning = async () => {
    setMustSpin(false);
    const { multiplier } = wheelSlices[prizeIndex];

    if (multiplier === 0) {
      // Lose
      setResultMessage(
        `You lost your bet of ${formatNumber(betAmount)} Mianus!`
      );
      setFloatingText(`-${formatNumber(betAmount)}`);
      setTimeout(() => setFloatingText(""), 1000);
    } else {
      // Win
      const totalReturn = Math.floor(betAmount * multiplier);
      const netGain = totalReturn - betAmount;
      const newBal = balance + netGain;

      try {
        await updateDoc(doc(db, "telegramUsers", id), { balance: newBal });
        setBalance(newBal);
      } catch (err) {
        console.error("Error updating user balance:", err);
      }

      setResultMessage(`You won ${formatNumber(totalReturn)} Mianus!`);
      setFloatingText(`+${formatNumber(totalReturn)}`);
      setShowCongratsGif(true);

      // Hide floating text after 1 second
      setTimeout(() => setFloatingText(""), 1000);
      // Hide confetti after 1.2s
      setTimeout(() => setShowCongratsGif(false), 1200);
    }

    // Show toast-like result
    setShowResult(true);
    setTimeout(() => setShowResult(false), 4000);
  };

  // Click spin
  const handleSpin = async () => {
    // Basic checks
    if (balance < 50000) return;
    if (betAmount < 10000) return;
    if (betAmount > balance) return;
    if (mustSpin) return;

    // Subtract bet first
    const newBal = balance - betAmount;
    try {
      await updateDoc(doc(db, "telegramUsers", id), { balance: newBal });
      setBalance(newBal);
    } catch (err) {
      console.error("Error subtracting bet:", err);
      return;
    }

    // Random slice
    const idx = Math.floor(Math.random() * wheelSlices.length);
    setPrizeIndex(idx);
    setMustSpin(true);
  };

  // Check if we can spin
  const canSpin =
    !mustSpin && balance >= 50000 && betAmount >= 10000 && betAmount <= balance;

  return (
    <Animate>
      <div className="w-full max-w-md mx-auto p-4 text-white">
        {/* Display total balance */}
        <div className="mb-2 text-center">
          Balance: {formatNumber(totalBalance)} Mianus
        </div>

        <div className="bg-[#ffffff1a] p-3 rounded-md shadow-md">
          <h2 className="text-xl mb-4 text-center">Mini Wheel</h2>

          {/* Bet input + spin */}
          <div className="flex items-center space-x-3 mb-3">
            <input
              type="number"
              placeholder="≥ 10,000 bet"
              className="flex-1 py-1 px-2 rounded-md 
                         bg-white text-black border border-gray-300
                         focus:outline-none focus:border-blue-500"
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
            />
            <button
              onClick={handleSpin}
              disabled={!canSpin}
              className={`px-3 py-2 text-white rounded-md font-semibold
                ${canSpin ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-500"}`}
            >
              Spin
            </button>
          </div>

          {/* Warnings */}
          <div className="text-red-400 text-sm min-h-[20px]">
            {balance < 50000 && <p>Need ≥ 50k Mianus.</p>}
            {betAmount < 10000 && <p>Min bet 10,000 Mianus.</p>}
            {betAmount > balance && <p>Insufficient balance.</p>}
          </div>

          {/* Wheel (no startingOptionIndex, no spinDuration) */}
          <div className="flex justify-center">
            <Wheel
              mustStartSpinning={mustSpin}
              prizeNumber={prizeIndex}
              data={wheelSlices}
              onStopSpinning={onStopSpinning}
              // Omit spinDuration => let default
              // Omit startingOptionIndex => let default
              outerBorderWidth={8}
              radiusLineWidth={3}
              fontSize={17}
              textDistance={60}
            />
          </div>
        </div>

        {/* Floating text during spin result */}
        {floatingText && (
          <div
            className="absolute top-1/2 left-1/2 transform 
                       -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          >
            <div className="bg-black bg-opacity-70 text-white px-2 py-1 rounded-md animate-bounce">
              {floatingText}
            </div>
          </div>
        )}

        {/* Toast-like result message */}
        {showResult && (
          <div className="fixed bottom-20 left-0 right-0 flex justify-center">
            <div
              className={`flex items-center space-x-2 px-3 py-2
                          bg-[#121620ef] rounded-lg text-sm w-fit
                          ${
                            resultMessage.includes("lost")
                              ? "text-red-400"
                              : "text-green-400"
                          }`}
            >
              {resultMessage.includes("lost") ? (
                <IoCloseCircle size={24} />
              ) : (
                <IoCheckmarkCircle size={24} />
              )}
              <span>{resultMessage}</span>
            </div>
          </div>
        )}

        {/* Congrats GIF (hidden if lost) */}
        {showCongratsGif && !resultMessage.includes("lost") && (
          <div className="absolute top-[30%] left-0 right-0 flex justify-center pointer-events-none">
            <img src={congratspic} alt="congrats" className="w-[180px]" />
          </div>
        )}
      </div>
    </Animate>
  );
};

export default LuckyWheel;
