import React from "react";
import { motion } from "framer-motion";
import MianusHero from "../images/mianushero.webp";
import GrassBg from "../images/grassbg.webp";

const MotionImage = motion.img;

const textStyle = {
  WebkitTextStroke: "1px red",
  WebkitTextFillColor: "white"
};

const CoinExplainer = () => {
  return (
    <div
      className="p-6 rounded-md text-center bg-cover bg-center"
      style={{
        backgroundImage: `url(${GrassBg})`,
        fontFamily: "'Slackey Regular', cursive"
      }}
    >
      {/* Glowing main image */}
      <MotionImage
        src={MianusHero}
        alt="Bet Mianus Hero"
        className="mx-auto max-h-[250px] md:max-h-[350px] object-contain rounded-md mb-6"
        animate={{
          filter: [
            "drop-shadow(0px 0px 2px rgba(255,255,255,0.8))",
            "drop-shadow(0px 0px 10px rgba(255,255,255,0.8))",
            "drop-shadow(0px 0px 2px rgba(255,255,255,0.8))"
          ]
        }}
        transition={{
          duration: 1.5,
          ease: "easeInOut",
          repeat: Infinity
        }}
      />

      <h2 className="text-2xl font-bold mb-4" style={textStyle}>
        Bet Mianus Platform
      </h2>
      <p className="mb-4" style={textStyle}>
        Provably fair crypto gaming with instant deposits and withdrawals.
      </p>
      <ul
        className="list-disc list-inside space-y-2 text-left max-w-md mx-auto"
        style={textStyle}
      >
        <li>Play Slots, Table Games, Crypto Games and Sports Betting</li>
        <li>Deposit & withdraw using ETH, TRON, BSC, SOL & BASE</li>
        <li>Share 100% of gross gaming revenue with $Mianus stakers</li>
        <li>No KYC – start playing immediately</li>
      </ul>
    </div>
  );
};

export default CoinExplainer;