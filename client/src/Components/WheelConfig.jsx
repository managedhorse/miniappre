// Components/wheelConfigs.jsx

/** Defines slice distributions for each difficulty */
export const wheelConfigs = {
  // **Easy**: 3× top prize
  // total slices = 28
  easy: [
    { label: "Lose", multiplier: 0,   color: "#F8AAFF", count: 13 },
    { label: "1.2×", multiplier: 1.2, color: "#4ADE80", count:  9 },
    { label: "1.5×", multiplier: 1.5, color: "#FACC15", count:  3 },
    { label: "3×",   multiplier: 3,   color: "#F472B6", count:  3 },
  ],

  // **Medium**: 10× top prize
  // total slices = 65
  medium: [
    { label: "Lose",  multiplier: 0,   color: "#F8AAFF", count: 37 },
    { label: "1.2×",  multiplier: 1.2, color: "#4ADE80", count: 16 },
    { label: "1.5×",  multiplier: 1.5, color: "#FACC15", count:  4 },
    { label: "3×",    multiplier: 3,   color: "#F472B6", count:  6 },
    { label: "10×",   multiplier: 10,  color: "#A78BFA", count:  2 },
  ],

  // **Hard**: 50× top prize (unchanged)
  // total slices = 98
  hard: [
    { label: "Lose",  multiplier: 0,  color: "#F8AAFF", count: 63 },
    { label: "1.2×",  multiplier: 1.2, color: "#4ADE80", count: 24 },
    { label: "1.5×",  multiplier: 1.5, color: "#FACC15", count:  4 },
    { label: "3×",    multiplier: 3,   color: "#F472B6", count:  6 },
    { label: "50×",   multiplier: 50,  color: "#A78BFA", count:  1 },
  ],
};

/** Utility to shuffle an array */
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Build the wheel items array for a given difficulty.
 * @param {"easy"|"medium"|"hard"} difficulty
 * @returns {Array<{label:string, backgroundColor:string, color:string, value:{multiplier:number}}>}
 */
export function makeWheelItems(difficulty) {
  const cfg = wheelConfigs[difficulty];
  const slices = [];
  cfg.forEach(({ label, multiplier, color, count }) => {
    for (let i = 0; i < count; i++) {
      slices.push({ label, multiplier, color });
    }
  });
  // shuffle and map into spin-wheel format
  return shuffleArray(slices).map(s => ({
    label: s.label,
    backgroundColor: s.color,
    color: s.multiplier === 0 ? "#FFFFFF" : "#000000",
    value: { multiplier: s.multiplier },
  }));
}
