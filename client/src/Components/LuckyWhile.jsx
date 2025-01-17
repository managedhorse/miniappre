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

/** We define the slices & frequencies we want. 
 *   Using 60 slices total for readability,
 *   but distributing them randomly so they are not bunched together.
 *   - Lose:   25 slices (≈ 41.7%)
 *   - 1.2×:   24 slices (≈ 40.0%)
 *   - 1.5×:    4 slices (≈ 6.7%)
 *   - 3×:      6 slices (≈ 10.0%)
 *   - 10×:     1 slice  (≈ 1.7%)
 */
const baseSlices = [
  ...Array(25).fill({ option: "Lose", multiplier: 0, color: "#D30000" }),
  ...Array(24).fill({ option: "1.2×", multiplier: 1.2, color: "#FFD700" }),
  ...Array(4).fill({ option: "1.5×", multiplier: 1.5, color: "#FFA500" }),
  ...Array(6).fill({ option: "3×", multiplier: 3, color: "#1E90FF" }),
  ...Array(1).fill({ option: "10×", multiplier: 10, color: "#800080" }),
];

/** Simple shuffle so slices are distributed more evenly around the wheel. */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Convert the slices into the final "react-custom-roulette" structure. */
function createWheelData() {
  const shuffled = shuffleArray(baseSlices);
  return shuffled.map((item) => ({
    option: item.option,
    style: {
      backgroundColor: item.color,
      textColor: "#fff",
    },
    multiplier: item.multiplier,
  }));
}

const LuckyWhile = () => {
  const { balance, refBonus, setBalance, id } = useUser();

  // We'll store the final wheel data in state once, so it doesn't shuffle on every render
  const [wheelData] = useState(createWheelData);

  const [betAmount, setBetAmount] = useState(10000); // minimal default bet
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeIndex, setPrizeIndex] = useState(0);

  const [floatingText, setFloatingText] = useState(""); // ephemeral text like "+12,000"

  // Simple messages for the "toast" at the bottom
  const [resultMessage, setResultMessage] = useState("");
  const [showResult, setShowResult] = useState(false);

  // Combine user balance & refBonus
  const totalBalance = balance + refBonus;

  /** Called after wheel stops. */
  const onStopSpinning = async () => {
    setMustSpin(false);
    const slice = wheelData[prizeIndex];
    const { multiplier } = slice;

    if (multiplier === 0) {
      // Lost entire bet
      setResultMessage(`You lost your bet of ${formatNumber(betAmount)} Mianus!`);
      showTempMessage();
      // Show ephemeral text like "-10,000" floating
      setFloatingText(`-${formatNumber(betAmount)}`);
      setTimeout(() => setFloatingText(""), 3000);
    } else {
      // Net gain = total returned - bet
      // total returned = bet * multiplier
      // net = bet*multiplier - bet = bet*(multiplier -1)
      const totalReturn = Math.floor(betAmount * multiplier);
      const netGain = totalReturn - betAmount;

      // Update user balance
      const newBal = balance + netGain;
      try {
        await updateDoc(doc(db, "telegramUsers", id), { balance: newBal });
        setBalance(newBal);
      } catch (error) {
        console.error("Error updating balance after spin:", error);
      }

      setResultMessage(`Congratulations! You won your bet × ${multiplier}!`);
      showTempMessage();

      // Ephemeral text e.g. "+12000"
      setFloatingText(`+${formatNumber(totalReturn)}`);
      setTimeout(() => setFloatingText(""), 3000);
    }
  };

  /** Spin button logic. */
  const handleSpin = async () => {
    // Validate conditions
    if (balance < 50000) return;
    if (betAmount < 10000) return;
    if (betAmount > balance) return;
    if (mustSpin) return; // already spinning

    // Subtract bet from user
    const newBal = balance - betAmount;
    try {
      await updateDoc(doc(db, "telegramUsers", id), { balance: newBal });
      setBalance(newBal);
    } catch (err) {
      console.error("Error subtracting bet:", err);
      return;
    }

    // Spin
    setMustSpin(true);

    // random index
    const idx = Math.floor(Math.random() * wheelData.length);
    setPrizeIndex(idx);
  };

  const canSpin =
    !mustSpin && balance >= 50000 && betAmount >= 10000 && betAmount <= balance;

  /** Utility to show toastlike result for a few seconds. */
  const showTempMessage = () => {
    setShowResult(true);
    setTimeout(() => setShowResult(false), 5000);
  };

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

          {/* Bet input & spin button side by side */}
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

          {/* Bet warnings */}
          <div className="mt-2 text-sm text-red-400 min-h-[20px]">
            {balance < 50000 && (
              <p>You need ≥ 50,000 Mianus to play.</p>
            )}
            {betAmount < 10000 && (
              <p>Minimum bet is 10,000 Mianus.</p>
            )}
            {betAmount > balance && (
              <p>Bet cannot exceed your balance.</p>
            )}
          </div>

          {/* The Wheel */}
          <div className="mt-4 flex justify-center">
            <div className="relative">
              <Wheel
                mustStartSpinning={mustSpin}
                prizeNumber={prizeIndex}
                data={wheelData.map((slice) => ({
                  option: slice.option,
                  style: {
                    backgroundColor: slice.style.backgroundColor,
                    textColor: slice.style.textColor,
                  },
                  // we ignore multiplier here, as we stored it in the original object
                }))}
                onStopSpinning={onStopSpinning}
                outerBorderWidth={4}
                innerRadius={30}
                radiusLineWidth={2}
                fontSize={14}
                textDistance={95} // push labels near the outer edge
                pointerProps={{
                  src: pointerImage,
                  style: {
                    width: "45px",
                    transform: "translateY(-8px)",
                  },
                }}
              />
              {/* Subtle overlay if you like */}
              <div className="absolute inset-0 shadow-lg pointer-events-none"></div>
            </div>
          </div>
        </div>

        {/* ephemeral floating text if any */}
        {floatingText && (
          <div className="absolute flex justify-center items-center top-[50%] left-[50%] 
                          transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="bg-black/60 text-white px-3 py-1 rounded-md animate-bounce">
              {floatingText}
            </div>
          </div>
        )}

        {/* Congratulations / Lose Message */}
        {showResult && (
          <div
            className="fixed left-0 right-0 mx-auto bottom-[80px]
                       flex justify-center z-[9999] px-4"
          >
            <div className="flex items-center space-x-2 px-4 py-2
                            bg-[#121620ef] rounded-[8px] shadow-lg
                            text-[#54d192] text-sm w-fit"
            >
              {resultMessage.includes("lost") ? (
                <IoCloseCircle size={24} className="text-red-400" />
              ) : (
                <IoCheckmarkCircle size={24} />
              )}
              <span className="font-medium slackey-regular">
                {resultMessage}
              </span>
            </div>
          </div>
        )}

        {/* Optionally show a small "Celebrate" image if you want a bigger effect */}
        {resultMessage.includes("Congratulations") && (
          <div className="absolute top-[-35px] left-0 right-0 flex justify-center pointer-events-none select-none">
            <img
              src={congratspic}
              alt="congrats"
              className="w-[200px] animate-fade-in"
            />
          </div>
        )}
      </div>
    </Animate>
  );
};

export default LuckyWhile;