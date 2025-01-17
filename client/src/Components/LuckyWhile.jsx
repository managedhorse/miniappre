import React, { useState, useEffect, useMemo } from "react";
import { Wheel } from "react-custom-roulette";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase.jsx";
import { useUser } from "../context/userContext.jsx";
import { IoCheckmarkCircle, IoCloseCircle } from "react-icons/io5";
import congratspic from "../images/celebrate.gif";
import Animate from "../Components/Animate";
import pointerImage from "../images/pointer.webp";

/** Format big numbers with commas. */
function formatNumber(num) {
  return num.toLocaleString("en-US");
}

/***************************************************************************
 * Define your slice distribution as before. 
 * This example uses about ~60 slices total:
 ***************************************************************************/
const baseSlices = [
  // (Lose) 25 slices => ~41.7%
  ...Array(25).fill({ option: "Lose", multiplier: 0, color: "#D30000" }),
  // (1.2×) 24 slices => ~40.0%, now racing green (#004225)
  ...Array(24).fill({ option: "1.2×", multiplier: 1.2, color: "#004225" }),
  // (1.5×) 4 slices => ~6.7%
  ...Array(4).fill({ option: "1.5×", multiplier: 1.5, color: "#FFA500" }),
  // (3×) 6 slices => ~10.0%
  ...Array(6).fill({ option: "3×", multiplier: 3, color: "#1E90FF" }),
  // (10×) 1 slice => ~1.7%
  ...Array(1).fill({ option: "10×", multiplier: 10, color: "#800080" }),
];

/** Shuffle the array once to randomize distribution, 
 * but keep it stable for the entire session so it spins properly.
 */
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
  // UseMemo ensures we only shuffle once and keep a stable slice array.
  const [wheelData] = useState(() => createWheelData());

  const [betAmount, setBetAmount] = useState(10000); // min bet
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeIndex, setPrizeIndex] = useState(0);

  const [floatingText, setFloatingText] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [showCongratsGif, setShowCongratsGif] = useState(false);

  const totalBalance = balance + refBonus;

  /************************************************************************
   * onStopSpinning => finalize the spin results
   ************************************************************************/
  const onStopSpinning = async () => {
    setMustSpin(false);

    const slice = wheelData[prizeIndex];
    const { multiplier } = slice;

    if (multiplier === 0) {
      // Lose case
      setResultMessage(`You lost your bet of ${formatNumber(betAmount)} Mianus!`);
      setFloatingText(`-${formatNumber(betAmount)}`);
      setTimeout(() => setFloatingText(""), 1500);
    } else {
      // Win case
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

      // Hide floating text after 1.5s
      setTimeout(() => setFloatingText(""), 1500);

      // Hide the gif after 1 second
      setTimeout(() => setShowCongratsGif(false), 1000);
    }

    setShowResult(true);
    setTimeout(() => setShowResult(false), 5000);
  };

  /************************************************************************
   * handleSpin => subtract bet, pick random slice, spin
   ************************************************************************/
  const handleSpin = async () => {
    if (balance < 50000) return;   // need ≥ 50K
    if (betAmount < 10000) return; // min bet = 10K
    if (betAmount > balance) return;
    if (mustSpin) return;

    // Subtract bet from user immediately
    const newBal = balance - betAmount;
    try {
      await updateDoc(doc(db, "telegramUsers", id), { balance: newBal });
      setBalance(newBal);
    } catch (err) {
      console.error("Error subtracting bet:", err);
      return;
    }

    // Choose a random slice
    const idx = Math.floor(Math.random() * wheelData.length);
    setPrizeIndex(idx);

    // Start spinning
    setMustSpin(true);
  };

  const canSpin =
    !mustSpin && balance >= 50000 && betAmount >= 10000 && betAmount <= balance;

  return (
    <Animate>
      <div className="grid grid-cols-1 place-items-center p-3 relative">
        {/* Display total balance at the top */}
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
              // removing startingOptionIndex fixes short partial spins with random slices
              onStopSpinning={onStopSpinning}
              outerBorderWidth={4}
              disableInitialAnimation={true}
              innerRadius={30}
              radiusLineWidth={2}
              fontSize={14}
              textDistance={75} // slightly closer to center than edge
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

        {/* Toast-like message */}
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

        {/* Congrats Image => hide after 1s */}
        {showCongratsGif && !resultMessage.includes("lost") && (
          <div className="absolute top-[-35px] left-0 right-0 flex justify-center pointer-events-none select-none">
            <img
              src={congratspic}
              alt="congrats"
              className="w-[200px]"
            />
          </div>
        )}
      </div>
    </Animate>
  );
};

export default LuckyWhile;