import React, { useState, useEffect } from "react";
import { Wheel } from "react-custom-roulette";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase.jsx";
import { useUser } from "../context/userContext.jsx";
import { IoCheckmarkCircle } from "react-icons/io5";
import congratspic from "../images/celebrate.gif";
import Animate from '../Components/Animate';
import pointerImage from "../images/pointer.webp";

// Roulette Data
const data = [
  { option: "1000" },
  { option: "2000" },
  { option: "3000" },
  { option: "5000" },
  { option: "6000" },
  { option: "8000" },
  { option: "9000" },
  { option: "10000" },
  { option: "11000" },
  { option: "12000" },
  { option: "14000" },
  { option: "15000" },
  { option: "16000" },
  { option: "18000" },
  { option: "19000" },
  { option: "20000" },
];

// Styling Constants
const backgroundColors = ["#1E90FF", "#FF4500"];
const textColors = ["#0b3351"];
const outerBorderColor = "#eeeeee";
const outerBorderWidth = 0;
const innerBorderColor = "#30261a";
const innerBorderWidth = 10;
const innerRadius = 20;
const radiusLineColor = "#eeeeee";
const radiusLineWidth = 2;
const fontFamily = "Slackey, sans-serif";
const fontWeight = "bold";
const fontSize = 20;
const fontStyle = "normal";
const textDistance = 70;
const spinDuration = 0.5;

const LuckyWhile = () => {
  const { balance, setBalance, id, timeSpin, setTimeSpin } = useUser();
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [congrats, setCongrats] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // Function to calculate the remaining time until next spin
  const calculateTimeRemaining = () => {
    if (!timeSpin) {
      return { hours: 0, minutes: 0, seconds: 0 };
    }

    const now = new Date();
    const lastSpinTime = timeSpin instanceof Date
      ? timeSpin.getTime()
      : new Date(timeSpin.seconds * 1000 + timeSpin.nanoseconds / 1000000).getTime();

    const nextSpinTime = lastSpinTime + 24 * 60 * 60 * 1000; // 24 hours in ms
    const timeDiff = nextSpinTime - now.getTime();

    if (timeDiff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0 };
    }

    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds };
  };

  // Update the countdown timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000); // Update every 1 second

    return () => clearInterval(interval); // Cleanup on unmount
  }, [timeSpin]);

  // Handle the spin action
  const handleSpinClick = async () => {
    if (!mustSpin && checkSpinCanDo()) {
      const newPrizeNumber = Math.floor(Math.random() * data.length);
      setPrizeNumber(newPrizeNumber);
      setMustSpin(true);

      const prizeAmount = Number(data[newPrizeNumber]?.option);
      const newBalance = Number(balance) + prizeAmount;
      const newTimeSpin = new Date();

      try {
        const userRef = doc(db, "telegramUsers", id);
        await updateDoc(userRef, {
          balance: newBalance,
          timeSpin: newTimeSpin, // Ensure Firestore stores as Timestamp if needed
        });

        // Update local state
        setBalance(newBalance);
        setTimeSpin(newTimeSpin);

        // Show congratulations message
        setTimeout(() => {
          setCongrats(true);
        }, 3000); // Show after spin animation

        setTimeout(() => {
          setCongrats(false);
        }, 9000); // Hide after 6 seconds
      } catch (error) {
        console.error("Error claiming spinner reward:", error);
      }
    }
  };

  // Check if the user can spin
  const checkSpinCanDo = () => {
    if (!timeSpin) {
      return true;
    }

    const now = new Date().getTime();
    const lastSpinTime = timeSpin instanceof Date
      ? timeSpin.getTime()
      : new Date(timeSpin.seconds * 1000 + timeSpin.nanoseconds / 1000000).getTime();

    const nextSpinTime = lastSpinTime + 24 * 60 * 60 * 1000; // 24 hours in ms

    return now > nextSpinTime;
  };

  // Handle Telegram Back Button
  useEffect(() => {
    // Show the back button when the component mounts
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.BackButton) {
      window.Telegram.WebApp.BackButton.show();

      // Attach a click event listener to handle the back navigation
      const handleBackButtonClick = () => {
        window.history.back();
      };

      window.Telegram.WebApp.BackButton.onClick(handleBackButtonClick);

      // Clean up the event listener and hide the back button when the component unmounts
      return () => {
        window.Telegram.WebApp.BackButton.offClick(handleBackButtonClick);
        window.Telegram.WebApp.BackButton.hide();
      };
    }
  }, []);

  return (
    <Animate>
      <div className="grid grid-cols-1 gap-4 place-items-center relative">
        <div className="p-5 bg-activebg border-[1px] border-activeborder rounded-lg w-[90%] shadow-lg">
          <h2 className="text-white slackey-regular text-[22px] font-medium text-center pt-2 w-full">
            Wheel of Fortune
          </h2>

          <div className="w-full pt-3 flex justify-center relative">
            <div className="perspective-1500">
              <div className="transform rotateY-5deg rotateX-5deg shadow-2xl">
                <Wheel
                  mustStartSpinning={mustSpin}
                  prizeNumber={prizeNumber}
                  data={data}
                  backgroundColors={backgroundColors}
                  textColors={textColors}
                  fontFamily={fontFamily}
                  fontSize={fontSize}
                  fontWeight={fontWeight}
                  fontStyle={fontStyle}
                  outerBorderColor={outerBorderColor}
                  outerBorderWidth={outerBorderWidth}
                  innerRadius={innerRadius}
                  innerBorderColor={innerBorderColor}
                  innerBorderWidth={innerBorderWidth}
                  radiusLineColor={radiusLineColor}
                  radiusLineWidth={radiusLineWidth}
                  spinDuration={spinDuration}
                  startingOptionIndex={2}
                  textDistance={textDistance}
                  pointerProps={{
                    src: pointerImage,
                    style: { 
                      width: '60px',
                      transform: 'translateY(-10px)',
                      filter: 'drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.3))',
                    },
                  }}
                  onStopSpinning={() => {
                    setMustSpin(false);
                  }}
                />
                <div className="absolute inset-0 shadow-lg pointer-events-none"></div>
              </div>
            </div>

            {/* Reflective Surface */}
            <div className="absolute top-full mt-4 w-full flex justify-center">
              <div className="w-64 h-2 bg-gradient-to-r from-transparent via-black to-transparent opacity-50 blur-lg"></div>
            </div>
          </div>

          <div className="flex justify-center w-full pt-3">
            <p className="text-sm slackey-regular">
              Spin the wheel to win Mianus!
            </p>
          </div>

          <div className="flex justify-center w-full pt-5">
            <button
              disabled={!checkSpinCanDo()}
              className={`${
                checkSpinCanDo() ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-btn2 text-[#fff6]"
              } relative rounded-full font-semibold py-2 px-6 min-w-52 transition-colors duration-300`}
              onClick={handleSpinClick}
            >
              {checkSpinCanDo() ? (
                <span className="font-medium slackey-regular tapguru2">SPIN</span>
              ) : (
                <span className="font-normal slackey-regular tapguru2">
                  {timeRemaining.hours}h {timeRemaining.minutes}m {timeRemaining.seconds}s
                </span>
              )}
            </button>
          </div>

          {/* Congratulations Image */}
          <div className="w-full absolute top-[-35px] left-0 right-0 flex justify-center z-20 pointer-events-none select-none">
            {congrats && (
              <img src={congratspic} alt="congrats" className="w-[80%] animate-fade-in" />
            )}
          </div>

          {/* Congratulations Message */}
          <div
            className={`${
              congrats ? "visible bottom-6" : "invisible bottom-[-10px]"
            } z-[60] ease-in duration-300 w-full fixed left-0 right-0 px-4`}
          >
            <div className="w-full text-[#54d192] flex items-center space-x-2 px-4 bg-[#121620ef] h-[50px] rounded-[8px] shadow-lg">
              <IoCheckmarkCircle size={24} className="" />
              <span className="font-medium slackey-regular">
                Congratulations, You have received {Number(data[prizeNumber]?.option)} points.
              </span>
            </div>
          </div>
        </div>
      </div>
    </Animate>
  );
};

export default LuckyWhile;
