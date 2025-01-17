
import React, { useState } from "react";
import SpinWheel from "../Components/spinWheel";

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

  // Example: click a button to spin
  const handleSpinClick = () => {
    if (!mustSpin) {
      // pick random slice
      const randomIndex = Math.floor(Math.random() * slicesData.length);
      setPrizeNumber(randomIndex);
      setMustSpin(true);
    }
  };

  // Called once spin completes
  const handleStop = () => {
    setMustSpin(false);
    // ... do any “reward logic”
  };

  return (
    <div style={{ textAlign: "center", marginTop: 30 }}>
      <h2>Demo: Isolated SpinWheel</h2>

      <SpinWheel
        data={slicesData}
        mustSpin={mustSpin}
        prizeNumber={prizeNumber}
        onStopSpinning={handleStop}
      />

      <button
        onClick={handleSpinClick}
        disabled={mustSpin}
        style={{ marginTop: 20 }}
      >
        Spin
      </button>
    </div>
  );
}