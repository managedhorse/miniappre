import React, { useState } from "react";
import SpinWheel from "../Components/spinWheel";
import "../App.css"; // or any global css with your new rule

const slicesData = [
  { option: "Lose" },
  { option: "Lose" },
  { option: "1.2×" },
  { option: "1.5×" },
  { option: "3×" },
  { option: "10×" },
];

export default function ParentWheelWrapper() {
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);

  const handleSpinClick = () => {
    if (!mustSpin) {
      const randomIndex = Math.floor(Math.random() * slicesData.length);
      setPrizeNumber(randomIndex);
      setMustSpin(true);
    }
  };

  const handleStop = () => {
    setMustSpin(false);
  };

  return (
    <div style={{ textAlign: "center", marginTop: 30 }}>
      <h2>Demo: Isolated SpinWheel</h2>
      {/* Wrap the <SpinWheel> in a special container with a custom class */}
      <div className="my-roulette-wheel-container">
        <SpinWheel
          data={slicesData}
          mustSpin={mustSpin}
          prizeNumber={prizeNumber}
          onStopSpinning={handleStop}
        />
      </div>
      <button onClick={handleSpinClick} disabled={mustSpin} style={{ marginTop: 20 }}>
        Spin
      </button>
    </div>
  );
}