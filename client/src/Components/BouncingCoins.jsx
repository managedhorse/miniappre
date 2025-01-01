import React, { useEffect, useState } from "react";
import coinsmall from "../images/coinsmall.webp";

const BouncingCoins = () => {
  const [coins, setCoins] = useState([]);

  useEffect(() => {
    const generateCoins = () => {
      const newCoins = Array.from({ length: 12 }, (_, index) => ({
        id: index,
        left: Math.random() * 100, // Random starting position (0% to 100% of the container width)
        animationDuration: Math.random() * 2 + 2, // Random animation duration between 2s and 4s
        animationDelay: Math.random() * 2, // Random delay between 0s and 2s
      }));
      setCoins(newCoins);
    };

    generateCoins();
  }, []);

  return (
    <div className="relative w-full h-[250px] overflow-hidden">
      {coins.map((coin) => (
        <img
        key={coin.id}
        src={coinsmall}
        alt="coin"
        className="absolute w-[50px] h-[50px] animate-parabola"
        style={{
          left: `${coin.left}%`, // Randomize between 10% and 90%
          animationDuration: `${coin.animationDuration}s`, // Random duration
          animationDelay: `${coin.animationDelay}s`, // Random delay
          }}
        />
      ))}
    </div>
  );
};

export default BouncingCoins;