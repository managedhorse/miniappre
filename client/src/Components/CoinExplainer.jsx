import React from "react";
import { motion } from "framer-motion";
import MianusHero from "../images/mianushero.webp";
import GrassBg from "../images/grassbg.webp";

const MotionImage = motion.img;

const textStyle = {
  textShadow: "2px 2px 0 rgba(255,0,0,1)"
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
    </div>
  );
};

export default CoinExplainer;