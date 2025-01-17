// SpinWheel.js (child)

import React from "react";
import { Wheel } from "react-custom-roulette";

// Example slices for demonstration:
const sampleData = [
  { option: "Lose" },
  { option: "Lose" },
  { option: "1.2×" },
  { option: "1.5×" },
  { option: "3×" },
  { option: "10×" },
];

function SpinWheel({
  data = sampleData,
  mustSpin,
  prizeNumber,
  onStopSpinning,
}) {
  return (
    <Wheel
      mustStartSpinning={mustSpin}
      prizeNumber={prizeNumber}
      data={data}
      // The moment the spin ends, we inform parent
      onStopSpinning={onStopSpinning}
      // If you previously used spinDuration, remove or set to a stable value
      // spinDuration={1} // or omit entirely if you prefer default

      // For good measure, disable the initial "snap backward" animation
      disableInitialAnimation={true}

      // Example styling
      outerBorderWidth={8}
      radiusLineWidth={2}
      innerRadius={5}
      fontSize={16}
      textDistance={55}
    />
  );
}

export default React.memo(SpinWheel);
