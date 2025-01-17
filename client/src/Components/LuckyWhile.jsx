import React, { useState, useEffect } from "react";
import { Wheel } from "react-custom-roulette";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase.jsx";  // Adjust path as needed
import { useUser } from "../context/userContext.jsx";
import { IoCheckmarkCircle } from "react-icons/io5";
import congratspic from "../images/celebrate.gif";
import Animate from "../Components/Animate";
import pointerImage from "../images/pointer.webp";

/**
 * We approximate 41.7% → 42 slices, etc., to total 100 slices:
 *  - 0× : 42 slices
 *  - 1.2×: 40 slices
 *  - 1.5×: 7 slices
 *  - 3×:   10 slices
 *  - 10×:  1 slice
 */
const wheelData = [
  ...Array(42).fill({ multiplier: 0, style: { backgroundColor: "#FF0000" }, option: "Lose" }),
  ...Array(40).fill({ multiplier: 1.2, style: { backgroundColor: "#FFD700" }, option: "1.2×" }),
  ...Array(7).fill({ multiplier: 1.5, style: { backgroundColor: "#FFA500" }, option: "1.5×" }),
  ...Array(10).fill({ multiplier: 3, style: { backgroundColor: "#1E90FF" }, option: "3×" }),
  ...Array(1).fill({ multiplier: 10, style: { backgroundColor: "#800080" }, option: "10×" }),
];
// We have 100 slices total. The library picks a random slice index.

const backgroundColors = ["#1E90FF", "#FF4500"];
const textColors = ["#0b3351"];

/** 
 * A Wheel of Fortune that:
 *  - Requires >= 50,000 Mianus to place a bet
 *  - Minimum bet: 10,000 Mianus
 *  - Outcome is determined by random slice from the approximate distribution.
 *  - Winnings = bet * (multiplier - 1). If multiplier=0 => lose entire bet.
 */
const LuckyWheelBet = () => {
  const { balance, setBalance, id } = useUser();
  
  // Local UI states
  const [betAmount, setBetAmount] = useState(10_000);  // default 10,000
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeIndex, setPrizeIndex] = useState(0);
  const [congrats, setCongrats] = useState(false);

  // Spin animation finish callback
  const [spinFinished, setSpinFinished] = useState(false);

  // For an optional "one spin per X hours" logic, you'd store lastSpinTime.
  // We'll skip that for now, or reuse your timeSpin logic if desired.
  // ... (omitted)

  // Determine if the user is allowed to wager at all
  const canWager = balance >= 50_000;

  // Determine if the spin button is enabled
  // Criteria:
  //  1) user must have >= 50_000
  //  2) bet >= 10,000
  //  3) bet <= user’s current balance
  const isSpinEnabled = 
    canWager &&
    betAmount >= 10_000 &&
    betAmount <= balance &&
    !mustSpin;

  // Called when the user clicks “SPIN”
  const handleSpinClick = async () => {
    if (!isSpinEnabled) return;

    // 1) Subtract bet from local and Firestore balances
    const newBalanceAfterBet = balance - betAmount;

    try {
      const userRef = doc(db, "telegramUsers", id);
      await updateDoc(userRef, {
        balance: newBalanceAfterBet,
      });
      setBalance(newBalanceAfterBet);
    } catch (error) {
      console.error("Error subtracting bet:", error);
      return; // If something fails, don’t proceed with the spin
    }

    // 2) Spin the wheel
    setMustSpin(true);

    // 3) Randomly choose slice index (0..99)
    const randomIndex = Math.floor(Math.random() * wheelData.length);
    setPrizeIndex(randomIndex);
    setSpinFinished(false);
  };

  // Called by react-custom-roulette after spin is done
  const handleStopSpinning = async () => {
    setMustSpin(false);
    setSpinFinished(true);

    // 1) Figure out multiplier
    const { multiplier } = wheelData[prizeIndex];
    // 2) Calculate final outcome
    // If multiplier=0 => user lost entire bet (which we already subtracted).
    // If multiplier > 0 => user’s net winning = bet * (multiplier - 1).
    let netWinnings = 0;
    if (multiplier > 0) {
      netWinnings = Math.floor(betAmount * multiplier - betAmount);
    }
    const finalBalance = balance + (netWinnings > 0 ? netWinnings : 0);

    // 3) Update Firestore + local state with finalBalance
    if (netWinnings !== 0) {
      try {
        const userRef = doc(db, "telegramUsers", id);
        await updateDoc(userRef, {
          balance: finalBalance,
        });
        setBalance(finalBalance);
      } catch (error) {
        console.error("Error updating final winnings:", error);
      }
    }

    // 4) If netWinnings>0, show “congrats”
    if (netWinnings > 0) {
      setCongrats(true);
      // Hide after e.g. 5s
      setTimeout(() => {
        setCongrats(false);
      }, 5000);
    }
  };

  return (
    <Animate>
      <div className="grid grid-cols-1 gap-4 place-items-center relative">
        <div className="p-5 bg-activebg border-[1px] border-activeborder rounded-lg w-[90%] shadow-lg">

          {/* Header */}
          <h2 className="text-white slackey-regular text-[22px] font-medium text-center pt-2 w-full">
            Lucky Wheel
          </h2>

          {/* Bet Input and Spin Button */}
          <div className="mt-4 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
              <label className="text-white slackey-regular text-[16px]">
                Enter your bet:
              </label>
              <input
                type="number"
                min={10_000}
                step={1000}
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="py-1 px-2 rounded-md border-[1px] border-[#cccccc] w-full sm:w-auto"
              />
            </div>

            {!canWager && (
              <p className="text-red-400 text-[14px]">
                You need at least 50,000 Mianus to place a bet.
              </p>
            )}
            {betAmount < 10_000 && (
              <p className="text-red-400 text-[14px]">
                Minimum bet is 10,000 Mianus.
              </p>
            )}
            {betAmount > balance && (
              <p className="text-red-400 text-[14px]">
                Bet cannot exceed your current balance.
              </p>
            )}
          </div>

          <div className="flex justify-center w-full pt-5">
            <button
              disabled={!isSpinEnabled}
              onClick={handleSpinClick}
              className={`${
                isSpinEnabled 
                  ? "bg-blue-500 hover:bg-blue-600 text-white" 
                  : "bg-btn2 text-[#fff6]"
              } relative rounded-full font-semibold py-2 px-6 min-w-52 transition-colors duration-300`}
            >
              {mustSpin ? "Spinning..." : "SPIN"}
            </button>
          </div>

          {/* Wheel Display */}
          <div className="w-full pt-3 flex justify-center relative">
            <div className="perspective-1500">
              <div className="transform rotateY-5deg rotateX-5deg shadow-2xl relative">
                <Wheel
                  mustStartSpinning={mustSpin}
                  prizeNumber={prizeIndex}
                  data={wheelData}
                  // We'll rely on the 'option' and 'style' in each wheelData object
                  backgroundColors={backgroundColors}
                  textColors={textColors}
                  fontFamily="Slackey, sans-serif"
                  fontSize={20}
                  onStopSpinning={handleStopSpinning}
                  // pointer
                  pointerProps={{
                    src: pointerImage,
                    style: { 
                      width: '60px',
                      transform: 'translateY(-10px)',
                      filter: 'drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.3))',
                    },
                  }}
                />
                <div className="absolute inset-0 shadow-lg pointer-events-none"></div>
              </div>
            </div>
          </div>

          {/* "You Won!" banner */}
          {congrats && (
            <div className="w-full absolute top-[-35px] left-0 right-0 flex justify-center z-20 pointer-events-none select-none">
              <img
                src={congratspic}
                alt="congrats"
                className="w-[80%] animate-fade-in"
              />
            </div>
          )}

          {congrats && (
            <div
              className="z-[60] w-full fixed left-0 right-0 px-4 bottom-6 transition-all duration-300"
            >
              <div className="w-full text-[#54d192] flex items-center space-x-2 px-4 bg-[#121620ef] h-[50px] rounded-[8px] shadow-lg">
                <IoCheckmarkCircle size={24} />
                <span className="font-medium slackey-regular">
                  Congratulations! You won your bet × multiplier!
                </span>
              </div>
            </div>
          )}

        </div>
      </div>
    </Animate>
  );
};

export default LuckyWheelBet;
