import React, { useEffect, useRef, useState } from "react";
// Import the 'Wheel' and possibly the 'easing' object if you need custom easing.
import { Wheel, easing } from "spin-wheel"; 

// We'll define a default set of items:
const wheelItems = [
  { label: "Lose",  backgroundColor: "#d30000" },
  { label: "Lose",  backgroundColor: "#d30000" },
  { label: "1.2×",  backgroundColor: "#004225" },
  { label: "1.5×",  backgroundColor: "#ffa500" },
  { label: "3×",    backgroundColor: "#1e90ff" },
  { label: "10×",   backgroundColor: "#800080" },
];

export default function LuckyWheel() {
  // Keep a reference to the container DOM element
  const containerRef = useRef(null);
  // Also keep a reference to our actual wheel instance:
  const [wheel, setWheel] = useState(null);

  // On mount, we create the wheel in the container
  useEffect(() => {
    if (containerRef.current && !wheel) {
      // Create new instance of Wheel
      const newWheel = new Wheel(containerRef.current, {
        items: wheelItems,
        pointerAngle: 0, // top is zero degrees
        lineWidth: 1,
        borderWidth: 2,
        borderColor: "#000",
        radius: 0.9, // 90% of the container size
        // You can define an onRest callback so you know which index is chosen
        onRest: (event) => {
          console.log("Wheel came to rest. currentIndex=", event.currentIndex);
        },
      });

      // Save instance to state
      setWheel(newWheel);
    }

    // Cleanup if needed:
    return () => {
      // remove wheel on unmount
      if (wheel) wheel.remove();
    };
  }, [wheel]);

  // Function to do a random spin:
  const handleSpin = () => {
    if (!wheel) return;

    // choose random item:
    const randomIndex = Math.floor(Math.random() * wheelItems.length);

    // spin to that item, 3-second duration, spin to the center of that slice
    // we can do 2 full revolutions, direction=1 => clockwise
    wheel.spinToItem(randomIndex, 3000, true, 2, 1, easing.cubicOut);
  };

  return (
    <div style={{ margin: "20px" }}>
      <h2>Spin-Wheel Demo</h2>
      {/* The container for the wheel */}
      <div
        ref={containerRef}
        style={{
          width: "300px",
          height: "300px",
          margin: "0 auto",
          background: "#eee",
          borderRadius: "50%",
          position: "relative",
        }}
      />
      
      <div style={{ textAlign: "center", marginTop: "15px" }}>
        <button onClick={handleSpin}>Spin</button>
      </div>
    </div>
  );
}