import React, { useEffect, useRef, useState } from "react";
// If you installed via NPM, import like this:
import { Wheel, easing } from "spin-wheel"; 
// If using a CDN, remove the import and rely on window.Wheel & window.easing.

import Animate from "../Components/Animate"; // Example of your existing wrapper

// Example items with random multipliers
const items = [
  { label: "Lose",  multiplier: 0, backgroundColor: "#D30000" },
  { label: "Lose",  multiplier: 0, backgroundColor: "#D30000" },
  { label: "1.2×",  multiplier: 1.2, backgroundColor: "#004225" },
  { label: "1.2×",  multiplier: 1.2, backgroundColor: "#004225" },
  { label: "1.5×",  multiplier: 1.5, backgroundColor: "#FFA500" },
  { label: "3×",    multiplier: 3,   backgroundColor: "#1E90FF" },
  { label: "10×",   multiplier: 10,  backgroundColor: "#800080" },
];

function formatNumber(num) {
  return num.toLocaleString("en-US");
}

export default function SpinWheel() {
  const containerRef = useRef(null); // We'll mount the wheel here
  const [wheel, setWheel] = useState(null);

  // Example: your game/bet states
  const [balance, setBalance] = useState(150_000);
  const [betAmount, setBetAmount] = useState(10_000);
  const [message, setMessage] = useState("");
  const [spinning, setSpinning] = useState(false);

  // 1) Initialize the wheel once after mount
  useEffect(() => {
    // Only create once:
    if (!containerRef.current || wheel) return;

    // You can create images in code and pass them for backgrounds or pointer overlay
    // For now, we'll just rely on basic color slices.

    const props = {
      // Items => each item gets a label, color, maybe an image...
      items: items.map((it) => ({
        label: it.label,
        backgroundColor: it.backgroundColor,
        // store your multiplier in item.value for retrieval
        value: it.multiplier,
      })),

      // Basic styling
      radius: 0.95,                // fill 95% of the container
      borderWidth: 2,             // optional border around wheel
      borderColor: "#222",
      lineWidth: 3,
      lineColor: "#333",
      // We can set pointerAngle so item '0' is at top, or leave as default
      pointerAngle: 0,

      // If you want user to spin with drag/flick, set isInteractive: true
      isInteractive: false, // We'll spin by code
    };

    const w = new Wheel(containerRef.current, props);
    setWheel(w);

    // If you want to "clean up" on unmount:
    return () => {
      w.remove(); // remove from DOM
    };
  }, [wheel]);

  // 2) Function to spin to a chosen item
  async function spinTheWheel() {
    if (!wheel) return; // not yet loaded
    if (spinning) return;
    if (balance < 50_000) {
      setMessage("Need ≥ 50,000 Mianus to spin.");
      return;
    }
    if (betAmount < 10_000) {
      setMessage("Min bet is 10,000 Mianus.");
      return;
    }
    if (betAmount > balance) {
      setMessage("Insufficient balance.");
      return;
    }
    // Subtract bet
    setBalance((b) => b - betAmount);

    // Decide winner or random distribution
    const randomIndex = Math.floor(Math.random() * items.length);

    setMessage("");
    setSpinning(true);

    // spinToItem: 
    //   itemIndex,   duration, spinToCenter, 
    //   numberOfRevs, direction, easingFunction
    wheel.spinToItem(
      randomIndex,
      3000,               // 3s spin
      true,               // spin to center of that slice
      2,                  // revolve 2 full rotations before stopping
      1,                  // clockwise
      easing.easeSinOut   // or your choice
    );

    // onSpin event can fire immediately, but we want onRest
    // We'll do "onRest" via callback or we can poll for it:
    // We'll just set up an event in code:
    wheel.onRest = (evt) => {
      setSpinning(false);
      const i = wheel.getCurrentIndex(); // pointer on that item
      const slice = wheel.items[i];
      const multiplier = slice.value || 0;

      if (multiplier === 0) {
        // Lost
        setMessage(`You lost your bet of ${formatNumber(betAmount)} Mianus.`);
      } else {
        // Win
        const totalReturn = Math.floor(betAmount * multiplier);
        const netGain = totalReturn - betAmount;
        const newBal = balance + netGain;
        setBalance(newBal);
        setMessage(
          `You won ${formatNumber(totalReturn)} Mianus! (multiplier ${multiplier})`
        );
      }
    };
  }

  return (
    <Animate>
      <div className="max-w-md mx-auto px-4 py-6 text-white">
        {/* Basic UI */}
        <h2 className="text-xl mb-3">Spin-Wheel Demo</h2>
        <div className="mb-2">
          <span>Balance: </span>
          <span className="font-bold">{formatNumber(balance)} Mianus</span>
        </div>

        <div className="flex space-x-2 mb-4">
          <input
            type="number"
            className="p-1 rounded text-black w-32"
            placeholder="Bet"
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
          />
          <button
            className={`px-3 py-1 rounded 
              ${spinning ? "bg-gray-500" : "bg-blue-600 hover:bg-blue-700"}`}
            onClick={spinTheWheel}
            disabled={spinning}
          >
            {spinning ? "Spinning..." : "Spin"}
          </button>
        </div>

        {message && (
          <div className="mb-4 text-red-300">{message}</div>
        )}

        {/* 3) The actual wheel container */}
        <div
          ref={containerRef}
          style={{
            width: "300px",  
            height: "300px",
            margin: "0 auto",
            position: "relative",
            background: "#111", // or something
          }}
        />

        {/* Optional pointer overlay:
            For example, a simple triangle or arrow absolutely positioned. */}
        <div
          style={{
            position: "relative",
            width: "300px",
            margin: "0 auto",
            marginTop: "-70px", /* move pointer over the wheel container */
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <svg width="60" height="60">
            {/* simple pointer triangle pointing downward */}
            <polygon 
              points="30,0 0,60 60,60"
              fill="gold"
              stroke="black"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
    </Animate>
  );
}