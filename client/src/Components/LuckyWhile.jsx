import React, { useState, useEffect } from "react";
import { Wheel } from "react-custom-roulette";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase.jsx";
import { useUser } from "../context/userContext.jsx";
import { IoCheckmarkCircle } from "react-icons/io5";
import congratspic from "../images/celebrate.gif";
import Animate from "../Components/Animate";
import pointerImage from "../images/pointer.webp";

// Approximate distribution using 60 slices total
const wheelData = [
  ...Array(25).fill({
    option: "Lose",
    multiplier: 0,
    style: { backgroundColor: "#FF0000", textColor: "#fff" },
  }),
  ...Array(24).fill({
    option: "1.2×",
    multiplier: 1.2,
    style: { backgroundColor: "#FFD700", textColor: "#333" },
  }),
  ...Array(4).fill({
    option: "1.5×",
    multiplier: 1.5,
    style: { backgroundColor: "#FFA500", textColor: "#fff" },
  }),
  ...Array(6).fill({
    option: "3×",
    multiplier: 3,
    style: { backgroundColor: "#1E90FF", textColor: "#fff" },
  }),
  ...Array(1).fill({
    option: "10×",
    multiplier: 10,
    style: { backgroundColor: "#800080", textColor: "#fff" },
  }),
];
// Total slices = 25 + 24 + 4 + 6 + 1 = 60

const LuckyWhile = () => {
  const { balance, setBalance, id } = useUser();

  const [betAmount, setBetAmount] = useState(10000); // default to 10,000
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeIndex, setPrizeIndex] = useState(0);
  const [congrats, setCongrats] = useState(false);

  // Called when the spinning stops
  const handleStopSpinning = async () => {
    setMustSpin(false);

    const slice = wheelData[prizeIndex];
    const { multiplier } = slice;
    // If multiplier=0 => lost entire bet (which we've already subtracted)
    // Otherwise, netWinnings = bet * (multiplier - 1)

    let netWinnings = 0;
    if (multiplier > 0) {
      netWinnings = Math.floor(betAmount * multiplier - betAmount);
    }

    // If netWinnings > 0, add it to the user's balance
    if (netWinnings > 0) {
      const newBalance = balance + netWinnings;
      try {
        await updateDoc(doc(db, "telegramUsers", id), {
          balance: newBalance,
        });
        setBalance(newBalance);
        setCongrats(true);
        setTimeout(() => {
          setCongrats(false);
        }, 5000);
      } catch (error) {
        console.error("Error updating balance after spin:", error);
      }
    }
  };

  // When user clicks SPIN
  const handleSpinClick = async () => {
    // Requirements:
    // - balance >= 50,000 to even place a bet
    // - bet >= 10,000
    // - bet <= balance
    if (balance < 50000 || betAmount < 10000 || betAmount > balance || mustSpin) return;

    // Subtract bet from user's balance right away
    const newBalance = balance - betAmount;
    try {
      await updateDoc(doc(db, "telegramUsers", id), {
        balance: newBalance,
      });
      setBalance(newBalance);
    } catch (error) {
      console.error("Error subtracting bet:", error);
      return;
    }

    // Spin the wheel
    setMustSpin(true);
    // Random slice index in range [0, wheelData.length)
    const randomIndex = Math.floor(Math.random() * wheelData.length);
    setPrizeIndex(randomIndex);
  };

  // Check whether the spin button is enabled or disabled
  const canSpin = !mustSpin &&
                  balance >= 50000 &&
                  betAmount >= 10000 &&
                  betAmount <= balance;

  return (
    <Animate>
      <div className="grid grid-cols-1 gap-4 place-items-center p-3 relative">
        <div className="p-4 bg-activebg border-[1px] border-activeborder rounded-lg w-full max-w-[400px] shadow-lg">
          
          {/* Title */}
          <h2 className="text-white slackey-regular text-[20px] font-medium text-center mb-2">
            Wheel of Fortune
          </h2>

          {/* Row with Bet Input & Spin Button side by side */}
          <div className="flex items-center space-x-2 w-full">
            <input
              type="number"
              min="10000"
              step="1000"
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              placeholder="Enter Bet (≥10k)"
              className="flex-1 py-1 px-2 rounded-md border-[1px] 
                         border-gray-400 bg-white text-black 
                         focus:outline-none focus:border-blue-500"
            />
            <button
              className={`px-4 py-2 text-white rounded-md font-semibold 
                          transition-colors duration-300 
                         ${canSpin ? "bg-blue-600 hover:bg-blue-700" 
                                   : "bg-gray-500 cursor-not-allowed"}`}
              onClick={handleSpinClick}
              disabled={!canSpin}
            >
              Spin
            </button>
          </div>

          {/* Wager restrictions messages */}
          <div className="mt-2 text-sm text-red-400 min-h-[20px]">
            {balance < 50000 && (
              <p>You need at least 50,000 Mianus to play.</p>
            )}
            {betAmount < 10000 && (
              <p>Minimum bet is 10,000 Mianus.</p>
            )}
            {betAmount > balance && (
              <p>Bet cannot exceed your balance.</p>
            )}
          </div>

          {/* Wheel */}
          <div className="mt-4 flex justify-center">
            <div className="relative">
              <Wheel
                mustStartSpinning={mustSpin}
                prizeNumber={prizeIndex}
                data={wheelData}
                onStopSpinning={handleStopSpinning}
                outerBorderWidth={3}
                innerRadius={30}
                radiusLineWidth={2}
                fontSize={14} // slightly bigger so text is more readable
                pointerProps={{
                  src: pointerImage,
                  style: {
                    width: '50px',
                    transform: 'translateY(-8px)',
                  },
                }}
              />
              {/* A subtle overlay for visual effect, optional */}
              <div className="absolute inset-0 shadow-lg pointer-events-none"></div>
            </div>
          </div>

          {/* Congratulations banner */}
          {congrats && (
            <>
              {/* Floating "CONGRATS" image */}
              <div className="absolute top-[-35px] left-0 right-0 flex justify-center z-20 pointer-events-none select-none">
                <img
                  src={congratspic}
                  alt="congrats"
                  className="w-[80%] animate-fade-in"
                />
              </div>
              {/* Toast-like message */}
              <div
                className="z-[60] w-full fixed left-0 right-0 px-4 bottom-[60px] 
                           flex justify-center"
              >
                <div className="flex items-center space-x-2 px-4 bg-[#121620ef] 
                                h-[50px] rounded-[8px] shadow-lg text-[#54d192]">
                  <IoCheckmarkCircle size={24} />
                  <span className="font-medium slackey-regular">
                    Congratulations! You won your bet × multiplier!
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Animate>
  );
};

export default LuckyWhile;
