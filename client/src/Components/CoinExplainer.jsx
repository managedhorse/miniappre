import React from "react";
import { motion } from "framer-motion";
import MianusHero from "../images/mianushero.webp";
import GrassBg from "../images/grassbg.webp";

const MotionImage = motion.img;

// 2px hard-offset shadows
const textStyle = {
  textShadow: [
    "-2px 0 0px red",
    "2px 0 0px red",
    "0 -2px 0px red",
    "0 2px 0px red",
  ].join(", "),
};
const linkTextStyle = {
  textShadow: [
    "-2px 0 0px black",
    "2px 0 0px black",
    "0 -2px 0px black",
    "0 2px 0px black",
  ].join(", "),
};

const CoinExplainer = () => (
  <div
    className="p-4 sm:p-6 rounded-md text-center bg-cover bg-center"
    style={{ backgroundImage: `url(${GrassBg})` }}
  >
    {/* Title */}
    <h2
      className="slackey-regular text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2"
      style={textStyle}
    >
      BET MIANUS
    </h2>

    {/* Intro */}
    <p className="slackey-regular text-sm sm:text-base md:text-lg mb-2" style={textStyle}>
      Provably fair crypto gaming
    </p>

    {/* Glowing Image */}
    <MotionImage
      src={MianusHero}
      alt="Bet Mianus Hero"
      className="mx-auto object-contain rounded-md mb-2 sm:mb-4 max-h-[150px] sm:max-h-[212px] md:max-h-[297px]"
      animate={{
        filter: [
          "drop-shadow(0px 0px 2px rgba(255,255,255,0.8))",
          "drop-shadow(0px 0px 10px rgba(255,255,255,0.8))",
          "drop-shadow(0px 0px 2px rgba(255,255,255,0.8))",
        ],
      }}
      transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
    />

    {/* Visit Site button */}
    <a
      href="https://betmian.us/?utm_campaign=tapmianus"
      target="_blank"
      rel="noopener noreferrer"
      className="
        slackey-regular text-[16px] sm:text-[18px]
        inline-block px-4 sm:px-6 py-1 sm:py-2
        bg-gradient-to-r from-[#FFCFEF] to-[#FFCFEF]
        border-2 border-[#2A3335] text-white rounded-md
        transition-transform transition-[background-image]
        duration-200 ease-in-out mb-2
      "
      style={linkTextStyle}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundImage = "linear-gradient(to right, #FF6F91, #FFBC42)";
        e.currentTarget.style.transform = "translateY(-3px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundImage = "linear-gradient(to right, #FFCFEF, #FFCFEF)";
        e.currentTarget.style.transform = "none";
      }}
    >
      Visit Bet Mianus Homepage
    </a>

    {/* Closing */}
    <p className="slackey-regular text-sm sm:text-base md:text-lg mt-2" style={textStyle}>
      Stake $Mianus & share 100% of GGR.
    </p>
  </div>
);

export default CoinExplainer;
