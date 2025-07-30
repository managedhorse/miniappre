import React from "react";
import { motion } from "framer-motion";
import MianusHero from "../images/mianushero.webp";
import GrassBg from "../images/grassbg.webp";

const MotionImage = motion.img;

const textStyle = {
  textShadow: "3px 3px 8px rgba(255,0,0,0.9)"
};

const CoinExplainer = () => {
  return (
    <div
      className="p-6 rounded-md text-center bg-cover bg-center"
      style={{ backgroundImage: `url(${GrassBg})` }}
    >
      {/* Title */}
      <h2
        className="slackey-regular text-[20px] font-bold mb-2"
        style={textStyle}
      >
        Bet Mianus Platform
      </h2>

      {/* Intro text */}
      <p
        className="slackey-regular text-[16px] mb-4"
        style={textStyle}
      >
        Provably fair crypto gaming with instant deposits & withdrawals across ETH, TRON, BSC, SOL & BASE.
      </p>

      {/* Glowing main image in middle (15% smaller) */}
      <MotionImage
        src={MianusHero}
        alt="Bet Mianus Hero"
        className="mx-auto max-h-[212px] md:max-h-[297px] object-contain rounded-md mb-2"
        animate={{
          filter: [
            "drop-shadow(0px 0px 2px rgba(255,255,255,0.8))",
            "drop-shadow(0px 0px 10px rgba(255,255,255,0.8))",
            "drop-shadow(0px 0px 2px rgba(255,255,255,0.8))"
          ]
        }}
        transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
      />

      {/* Visit Site link */}
      <a
        href="https://betmian.us"
        className="slackey-regular text-[16px] underline mb-4 inline-block"
        style={textStyle}
      >
        Visit Site
      </a>

      {/* Closing text */}
      <p
        className="slackey-regular text-[16px] mt-2"
        style={textStyle}
      >
        Stake $Mianus tokens to share 100% of gross gaming revenue. No KYC – start playing now.
      </p>
    </div>
  );
};

export default CoinExplainer;