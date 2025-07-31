import React from "react";
import { motion } from "framer-motion";
import MianusHero from "../images/mianushero.webp";
import GrassBg from "../images/grassbg.webp";

const MotionImage = motion.img;

// Sharp black shadow on all four sides
const linkTextShadow = [
  "-1px  0   0px black",  // left
  " 1px  0   0px black",  // right
  " 0   -1px 0px black",  // above
  " 0    1px 0px black"   // below
].join(", ");

const textStyle = {
  textShadow: "0 0 2px rgba(255,0,0,1)" // stays red for headings/body
};

const CoinExplainer = () => (
  <div
    className="p-6 rounded-md text-center bg-cover bg-center"
    style={{ backgroundImage: `url(${GrassBg})` }}
  >
    {/* Title */}
    <h2
      className="slackey-regular text-[30px] font-bold mb-2"
      style={textStyle}
    >
      BET MIANUS
    </h2>

    {/* Intro */}
    <p className="slackey-regular text-[16px] mb-4" style={textStyle}>
      Provably fair crypto gaming
    </p>

    {/* Glowing main image */}
    <MotionImage
      src={MianusHero}
      alt="Bet Mianus Hero"
      className="mx-auto max-h-[212px] md:max-h-[297px] object-contain rounded-md mb-4"
      animate={{
        filter: [
          "drop-shadow(0px 0px 2px rgba(255,255,255,0.8))",
          "drop-shadow(0px 0px 10px rgba(255,255,255,0.8))",
          "drop-shadow(0px 0px 2px rgba(255,255,255,0.8))",
        ],
      }}
      transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
    />

    {/* Visit Site button (emulated Chakra) */}
    <a
      href="https://betmian.us"
      target="_blank"
      rel="noopener noreferrer"
      className={`
        slackey-regular
        text-[18px]
        inline-block
        px-6 py-2           /* reduced vertical padding */
        bg-gradient-to-r from-[#FFCFEF] to-[#FFCFEF]
        border-2 border-[#2A3335]
        text-white
        rounded-md
        transition-transform transition-[background-image]
        duration-200 ease-in-out
      `}
      style={{ textShadow: linkTextShadow }}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundImage = "linear-gradient(to right, #FF6F91, #FFBC42)";
        e.currentTarget.style.transform = "translateY(-3px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundImage = "linear-gradient(to right, #FFCFEF, #FFCFEF)";
        e.currentTarget.style.transform = "none";
      }}
    >
      Visit Site
    </a>

    {/* Closing text */}
    <p className="slackey-regular text-[16px] mt-4" style={textStyle}>
      Stake $Mianus tokens to share 100% of gross gaming revenue.
    </p>
  </div>
);

export default CoinExplainer;
