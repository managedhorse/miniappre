import React, { useState, useEffect } from "react";
import { Wheel } from "react-custom-roulette";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase.jsx";
import { useUser } from "../context/userContext.jsx";
import { IoCheckmarkCircle, IoCloseCircle } from "react-icons/io5";
import congratspic from "../images/celebrate.gif";
import Animate from "../Components/Animate";
import pointerImage from "../images/pointer.webp";

/** A small helper to format big numbers with commas. */
function formatNumber(num) {
  return num.toLocaleString("en-US");
}

/** Example slice distribution. 
 *  Weighted approach: total ~60 slices, 
 *  but reduce or modify for your desired probabilities.
 */
const baseSlices = [
  // 25 slices => 'Lose' => ~41.7%
  ...Array(25).fill({ option: "Lose", multiplier: 0, color: "#D30000" }),
  // 24 slices => '1.2×' => ~40.0%
  ...Array(24).fill({ option: "1.2×", multiplier: 1.2, color: "#FFD700" }),
  // 4 slices => '1.5×' => ~6.7%
  ...Array(4).fill({ option: "1.5×", multiplier: 1.5, color: "#FFA500" }),
  // 6 slices => '3×' => ~10.0%
  ...Array(6).fill({ option: "3×", multiplier: 3, color: "#1E90FF" }),
  // 1 slice => '10×' => ~1.7%
  ...Array(1).fill({ option: "10×", multiplier: 10, color: "#800080" }),
];

/** Shuffle the array so slices aren't bunched together. */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createWheelData() {
  const shuffled = shuffleArray(baseSlices);
  return shuffled.map((item) => ({
    option: item.option,
    multiplier: item.multiplier,
    style: {
      backgroundColor: item.color,
      textColor: "#ffffff",
    },
  }));
}

const LuckyWhile = () => {
  const { balance, refBonus, setBalance, id } = useUser();

  // We generate wheel slices once and keep them stable
  const [wheelData] = useState(createWheelData);

  const [betAmount, setBetAmount] = useState(10000); // minimum bet
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeIndex, setPrizeIndex] = useState(0);

  // ephemeral floating text: e.g. "+12,000"
  const [floatingText, setFloatingText] = useState("");

  // Toast-like result
  const [resultMessage, setResultMessage] = useState("");
  const [showResult, setShowResult] = useState(false);

  // Confetti image
  const [showCongratsGif, setShowCongratsGif] = useState(false);

  const totalBalance = balance + refBonus;

  /************************************************************************
   * ROULETTE SPIN CALLBACK
   ************************************************************************/
  const onStopSpinning = async () => {
    setMustSpin(false);

    const slice = wheelData[prizeIndex];
    const { multiplier } = slice;

    // If 0 => lost
    if (!multiplier) {
      setResultMessage(`You lost your bet of ${formatNumber(betAmount)} Mianus!`);
      setFloatingText(`-${formatNumber(betAmount)}`);
      setTimeout(() => setFloatingText(""), 2500);
    } else {
      // user *already* had bet subtracted in handleSpin
      const totalReturn = Math.floor(betAmount * multiplier);
      const netGain = totalReturn - betAmount;
      const newBal = balance + netGain;

      try {
        await updateDoc(doc(db, "telegramUsers", id), { balance: newBal });
        setBalance(newBal);
      } catch (error) {
        console.error("Error updating balance after spin:", error);
      }

      setResultMessage(`Congratulations! You won your bet × ${multiplier}!`);
      setFloatingText(`+${formatNumber(totalReturn)}`);
      setShowCongratsGif(true);
      setTimeout(() => setFloatingText(""), 2500);
    }

    // show the result popup for 5s
    setShowResult(true);
    setTimeout(() => setShowResult(false), 5000);
  };

  /************************************************************************
   * SPIN LOGIC
   ************************************************************************/
  const handleSpin = async () => {
    if (balance < 50000) return;   // need ≥ 50K
    if (betAmount < 10000) return; // min bet = 10K
    if (betAmount > balance) return;
    if (mustSpin) return;

    // subtract bet from user
    const newBal = balance - betAmount;
    try {
      await updateDoc(doc(db, "telegramUsers", id), { balance: newBal });
      setBalance(newBal);
    } catch (err) {
      console.error("Error subtracting bet:", err);
      return;
    }

    // pick random slice
    const idx = Math.floor(Math.random() * wheelData.length);
    setPrizeIndex(idx);

    // spin
    setMustSpin(true);
  };

  const canSpin =
    !mustSpin && balance >= 50000 && betAmount >= 10000 && betAmount <= balance;

  /************************************************************************
   * Confetti image fade-out
   ************************************************************************/
  const handleCongratsAnimationEnd = () => {
    setShowCongratsGif(false);
  };

  /************************************************************************
   * JSX
   ************************************************************************/
  return (
    <Animate>
      <div className="grid grid-cols-1 place-items-center p-3 relative">
        {/* Show total balance at top */}
        <div className="text-white mb-2 text-center">
          Balance: {formatNumber(totalBalance)} Mianus
        </div>

        <div className="p-4 bg-activebg border border-activeborder rounded-lg w-full max-w-[420px] shadow-lg">
          {/* Title */}
          <h2 className="text-white slackey-regular text-[20px] font-medium text-center mb-2">
            Wheel of Fortune
          </h2>

          {/* Bet + Spin row */}
          <div className="flex items-center space-x-2 w-full">
            <input
              type="number"
              placeholder="Enter bet (≥ 10,000)"
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
                          transition-colors duration-300
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

          {/* The Wheel */}
          <div className="mt-4 flex justify-center">
            <Wheel
              mustStartSpinning={mustSpin}
              prizeNumber={prizeIndex}
              data={wheelData.map((slice) => ({
                option: slice.option,
                style: slice.style,
              }))}
              spinDuration={4} // ~4s spin
              onStopSpinning={onStopSpinning}
              outerBorderWidth={4}
              innerRadius={30}
              radiusLineWidth={2}
              fontSize={14}
              textDistance={85} // a bit closer to center
              pointerProps={{
                src: pointerImage,
                style: { width: "50px", transform: "translateY(-8px)" },
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

        {/* Toastlike message */}
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

        {/* Congratulations Image */}
        {showCongratsGif && !resultMessage.includes("lost") && (
          <div className="absolute top-[-35px] left-0 right-0 flex justify-center pointer-events-none select-none">
            <img
              src={congratspic}
              alt="congrats"
              className="w-[200px] animate-fade-in-once"
              onAnimationEnd={handleCongratsAnimationEnd}
            />
          </div>
        )}
      </div>
    </Animate>
  );
};

export default LuckyWhile;