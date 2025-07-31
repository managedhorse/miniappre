import React from "react";
import { motion } from "framer-motion";
import MianusHero from "../images/mianushero.webp";
import GrassBg from "../images/grassbg.webp";

const MotionImage = motion.img;

// Sharp red drop-shadow with zero blur
const textStyle = {
  textShadow: "2px 2px 0px rgba(255,0,0,1)"
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
        BET MIANUS
      </h2>

      {/* Intro text */}
      <p className="slackey-regular text-[16px] mb-4" style={textStyle}>
        Provably fair crypto gaming
      </p>

      {/* Glowing main image */}
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

      {/* Visit Site button */}
      <button
        onClick={() => window.open("https://betmian.us", "_blank")}
        className="slackey-regular text-[16px] py-2 px-4 bg-red-600 text-white rounded-md mb-4 inline-block"
        style={textStyle}
      >
        Visit Site
      </button>

      {/* Closing text */}
      <p className="slackey-regular text-[16px]" style={textStyle}>
        Stake $Mianus tokens to share 100% of gross gaming revenue.
      </p>
    </div>
  );
};

export default CoinExplainer;
