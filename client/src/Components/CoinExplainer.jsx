import React from "react";
import { motion } from "framer-motion";
import { Button } from "@chakra-ui/react";
import MianusHero from "../images/mianushero.webp";
import GrassBg from "../images/grassbg.webp";

const MotionImage = motion.img;

const basePinkGradient = "linear(to-r, #FFCFEF, #FFCFEF)";
const buttonHoverStyle = {
  transitionProperty: "transform, background-image",
  transitionDuration: "0.2s, 0.8s",
  transitionTimingFunction: "ease-in-out, ease-in-out",
  _hover: {
    transform: "translateY(-3px)",
    bgGradient: "linear(to-r, #FF6F91, #FFBC42)",
    color: "#FFFFFF",
    border: "2px solid #2A3335",
  },
};

// Sharp, equally-distributed red glow
const textStyle = {
  textShadow: "0px 0px 2px rgba(255,0,0,1)",
};

const CoinExplainer = () => (
  <div
    className="p-6 rounded-md text-center bg-cover bg-center"
    style={{ backgroundImage: `url(${GrassBg})` }}
  >
    {/* Title */}
    <h2 className="slackey-regular text-[20px] font-bold mb-2" style={textStyle}>
      BET MIANUS
    </h2>

    {/* Intro */}
    <p className="slackey-regular text-[16px] mb-4" style={textStyle}>
      Provably fair crypto gaming
    </p>

    {/* Glowing main image (15% smaller) */}
    <MotionImage
      src={MianusHero}
      alt="Bet Mianus Hero"
      className="mx-auto max-h-[212px] md:max-h-[297px] object-contain rounded-md mb-2"
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
    <Button
      {...buttonHoverStyle}
      as="a"
      href="https://betmian.us"
      fontFamily="Slackey, cursive"
      fontSize="18px"
      bgGradient={basePinkGradient}
      border="2px solid #2A3335"
      color="#FFFFFF"
      textShadow="2px 2px #2A3335"
      rounded="md"
      px="6"
      py="4"
      mb="4"
    >
      Visit Site
    </Button>

    {/* Closing text */}
    <p className="slackey-regular text-[16px]" style={textStyle}>
      Stake $Mianus tokens to share 100% of gross gaming revenue.
    </p>
  </div>
);

export default CoinExplainer;

