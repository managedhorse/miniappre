// Plutos.jsx
import React, { useState, useEffect, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.jsx'; // Adjust the path as needed
import styled, { keyframes } from "styled-components";
import Animate from '../Components/Animate.jsx';
import Spinner from '../Components/Spinner.jsx';
import { useUser } from '../context/userContext.jsx';
import Levels from '../Components/Levels.jsx';
import flash from "../images/battery.webp";
import coinsmallClosed from "../images/coinsmall.webp"; // Closed mouth image
import coinsmallOpen from "../images/coinsmall-open.webp"; // Open mouth image
import luckyWheel from "../images/lucky-wheel.png";
import dailyReward from "../images/daily-reward.png";
import dailyCombo from "../images/daily-cipher.png";
import tswap from "../images/tswap.png";
import { v4 as uuidv4 } from 'uuid'; // Import uuid for unique IDs
import { useNavigate } from 'react-router-dom';
import Splash from '../Components/Splash.jsx'; 

// Define keyframes for slide up
const slideUp = keyframes`
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-350px);
  }
`;

// Styled component for slide-up text
const SlideUpText = styled.div`
  position: absolute;
  animation: ${slideUp} 3s ease-out forwards;
  font-size: 2.1em;
  color: #ffffffa6;
  font-weight: 400; /* Match the font weight of Slackey Regular */
  font-family: 'Slackey', sans-serif; /* Apply the Slackey font */
  left: ${({ x }) => x}px;
  top: ${({ y }) => y}px;
  pointer-events: none; /* Prevent any interaction */
`;

// Styled component for container
const Container = styled.div`
  position: relative; /* Ensure container is relative for absolute positioning */
  display: inline-block;
  text-align: center;
  width: 100%;
  height: 100%;
`;

// Define wobble animations with vendor prefixes
const wobbleLeft = keyframes`
  0% { transform: rotate(0deg); }
  25% { transform: rotate(-7deg); }
  50% { transform: rotate(0deg); }
  75% { transform: rotate(-3deg); }
  100% { transform: rotate(0deg); }
`;

const wobbleRight = keyframes`
  0% { transform: rotate(0deg); }
  25% { transform: rotate(7deg); }
  50% { transform: rotate(0deg); }
  75% { transform: rotate(3deg); }
  100% { transform: rotate(0deg); }
`;

const wobbleTop = keyframes`
  0% { transform: translateY(0); }
  25% { transform: translateY(-7px); }
  50% { transform: translateY(0); }
  75% { transform: translateY(-3px); }
  100% { transform: translateY(0); }
`;

const wobbleBottom = keyframes`
  0% { transform: translateY(0); }
  25% { transform: translateY(7px); }
  50% { transform: translateY(0); }
  75% { transform: translateY(3px); }
  100% { transform: translateY(0); }
`;

// Styled component for wobble animations
const WobbleImage = styled.img`
  &.wobble-left {
    animation: ${wobbleLeft} 0.3s;
    -webkit-animation: ${wobbleLeft} 0.3s;
  }
  &.wobble-right {
    animation: ${wobbleRight} 0.3s;
    -webkit-animation: ${wobbleRight} 0.3s;
  }
  &.wobble-top {
    animation: ${wobbleTop} 0.3s;
    -webkit-animation: ${wobbleTop} 0.3s;
  }
  &.wobble-bottom {
    animation: ${wobbleBottom} 0.3s;
    -webkit-animation: ${wobbleBottom} 0.3s;
  }
`;

const Plutos = () => {

  // Declare state hooks first
  const [splashes, setSplashes] = useState([]); // Array to manage multiple splashes
  const [clicks, setClicks] = useState([]);   // Array of click objects
  const { balance, username, tapBalance, energy, battery, tapGuru, mainTap, setIsRefilling, refillIntervalRef, refillEnergy, setEnergy, tapValue, setTapBalance, setBalance, refBonus, level, loading } = useUser();
  const [points, setPoints] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false);
  const [openClaim, setOpenClaim] = useState(false);
  const [congrats, setCongrats] = useState(false);
  const [glowBooster, setGlowBooster] = useState(false);
  const [showLevels, setShowLevels] = useState(false);
  const [isMouthOpen, setIsMouthOpen] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  const debounceTimerRef = useRef(null);
  const refillTimerRef = useRef(null);
  const isUpdatingRef = useRef(false);
  const accumulatedBalanceRef = useRef(balance);
  const accumulatedEnergyRef = useRef(energy);
  const accumulatedTapBalanceRef = useRef(tapBalance);
  const refillTimeoutRef = useRef(null);
  const lastSplashTimeRef = useRef(0);
  const imageRef = useRef(null);
  const containerRef = useRef(null); // Reference to the container for positioning

  const navigate = useNavigate();

  // Debugging: Log splashes and clicks state changes
  useEffect(() => {
  }, [splashes]);

  useEffect(() => {
 
  }, [clicks]);

  useEffect(() => {
    accumulatedEnergyRef.current = energy;
  }, [energy]);

  useEffect(() => {
    accumulatedBalanceRef.current = balance;
  }, [balance]);

  useEffect(() => {
    accumulatedTapBalanceRef.current = tapBalance;
  }, [tapBalance]);

  // Preload the splash GIF to ensure it's ready when needed
  useEffect(() => {
    const img = new Image();
    img.src = '/splat.gif';
  }, []);

  function triggerHapticFeedback() {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isIOS && window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    } else if (isAndroid && 'vibrate' in navigator) {
      // Use the vibration API on Android
      navigator.vibrate(50); // Vibrate for 50ms
    } else {
   
    }
  }

  const handleTap = () => {
    setIsMouthOpen(true);
    setTimeout(() => {
      setIsMouthOpen(false);
    }, 100); // Duration matches the animation length
  };

  // Function to remove a specific splash by ID
  const removeSplash = (id) => {

    setSplashes((prevSplashes) => prevSplashes.filter((splash) => splash.id !== id));
  };

  // Function to remove a specific click by ID
  const removeClick = (id) => {
  
    setClicks((prevClicks) => prevClicks.filter((click) => click.id !== id));
  };

  // Function to add a new splash and click
  const addSplashAndClick = (x, y, valueMultiplier = 1) => {
    const newSplash = {
      id: uuidv4(), // Unique ID for the splash
      x: x,
      y: y,
      multiplier: valueMultiplier,
    };

    
    // Add the new splash to the splashes array
    setSplashes((prevSplashes) => [...prevSplashes, newSplash]);

    // Add a new click for SlideUpText
    const newClick = {
      id: uuidv4(), // Unique ID for the click
      x: x,
      y: y,
      multiplier: valueMultiplier,
    };
   
    setClicks((prevClicks) => [...prevClicks, newClick]);

    // Update points and balances based on the multiplier
    setPoints((prevPoints) => prevPoints + tapValue.value * valueMultiplier);
    setBalance((prevBalance) => {
      const newBalance = prevBalance + tapValue.value * valueMultiplier;
      accumulatedBalanceRef.current = newBalance;
      return newBalance;
    });
    setTapBalance((prevTapBalance) => {
      const newTapBalance = prevTapBalance + tapValue.value * valueMultiplier;
      accumulatedTapBalanceRef.current = newTapBalance;
      return newTapBalance;
    });

    // Deduct energy if applicable
    if (valueMultiplier === 1) { // Only deduct energy for normal taps
      setEnergy((prevEnergy) => {
        const newEnergy = Math.max(prevEnergy - tapValue.value, 0); // Ensure energy does not drop below zero
        accumulatedEnergyRef.current = newEnergy;
        return newEnergy;
      });
    }

    // Schedule removal of the splash after the GIF duration (e.g., 1 second)
    setTimeout(() => {
      removeSplash(newSplash.id);
    }, 1000); // Adjust the timeout to match the GIF duration

    // Schedule removal of the click after the SlideUpText animation duration
    setTimeout(() => {
      removeClick(newClick.id);
    }, 3000); // Match this duration with SlideUpText animation duration
  };

  const handleTouchStart = (e) => {
    e.preventDefault(); // Prevent default touch behaviors like scrolling

    handleTap();
    triggerHapticFeedback();

    if (energy <= 0 || isDisabled || isUpdatingRef.current) {
      setGlowBooster(true); // Trigger glow effect if energy and points are 0
      setTimeout(() => {
        setGlowBooster(false); // Remove glow effect after 0.3 seconds
      }, 300);
      return; // Exit if no energy left or if clicks are disabled or if an update is in progress
    }

    const touch = e.nativeEvent.touches[0]; // Get the first touch point
    const target = containerRef.current; // Use containerRef instead of e.target
    const rect = target.getBoundingClientRect();

    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // Determine animation class based on touch position
    const horizontalMidpoint = target.clientWidth / 2;
    const verticalMidpoint = target.clientHeight / 2;

    let newAnimationClass = '';
    if (x < horizontalMidpoint) {
      newAnimationClass = 'wobble-left';
    } else if (x > horizontalMidpoint) {
      newAnimationClass = 'wobble-right';
    } else if (y < verticalMidpoint) {
      newAnimationClass = 'wobble-top';
    } else {
      newAnimationClass = 'wobble-bottom';
    }

    setAnimationClass(newAnimationClass);

    // Remove the animation class after animation ends to allow re-animation on the same side
    setTimeout(() => {
      setAnimationClass('');
    }, 500); // Duration should match the animation duration in CSS

    // Add the splash and click
    addSplashAndClick(x, y, 1);

    // Reset the refill timer
    clearInterval(refillIntervalRef.current); // Stop refilling while the user is active
    setIsRefilling(false); // Set refilling state to false
    clearTimeout(refillTimeoutRef.current);
    refillTimeoutRef.current = setTimeout(() => {
      if (energy < battery.energy) {
        refillEnergy();
      }
    }, 1000); // Set the inactivity period to 1 second (adjust as needed)
  };

  const handleTouchStartGuru = (e) => {
    e.preventDefault(); // Prevent default touch behaviors like scrolling

    handleTap();
    triggerHapticFeedback();

    if (energy <= 0 || isDisabled || isUpdatingRef.current) {
      setGlowBooster(true); // Trigger glow effect if energy and points are 0
      setTimeout(() => {
        setGlowBooster(false); // Remove glow effect after 0.3 seconds
      }, 300);
      return; // Exit if no energy left or if clicks are disabled or if an update is in progress
    }

    const touch = e.nativeEvent.touches[0]; // Get the first touch point
    const target = containerRef.current; // Use containerRef instead of e.target
    const rect = target.getBoundingClientRect();

    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // Determine animation class based on touch position
    const horizontalMidpoint = target.clientWidth / 2;
    const verticalMidpoint = target.clientHeight / 2;

    let newAnimationClass = '';
    if (x < horizontalMidpoint) {
      newAnimationClass = 'wobble-left';
    } else if (x > horizontalMidpoint) {
      newAnimationClass = 'wobble-right';
    } else if (y < verticalMidpoint) {
      newAnimationClass = 'wobble-top';
    } else {
      newAnimationClass = 'wobble-bottom';
    }

    setAnimationClass(newAnimationClass);

    // Remove the animation class after animation ends to allow re-animation on the same side
    setTimeout(() => {
      setAnimationClass('');
    }, 500); // Duration should match the animation duration in CSS

    // Add the splash and click with a multiplier of 5
    addSplashAndClick(x, y, 5);

    // Reset the refill timer
    clearInterval(refillIntervalRef.current); // Stop refilling while the user is active
    setIsRefilling(false); // Set refilling state to false
    clearTimeout(refillTimeoutRef.current);
    refillTimeoutRef.current = setTimeout(() => {
      if (energy < battery.energy) {
        refillEnergy();
      }
    }, 1000); // Set the inactivity period to 1 second (adjust as needed)
  };

  const updateFirestore = async () => {
    const telegramUser = window.Telegram.WebApp.initDataUnsafe?.user;
    if (telegramUser) {
      const { id: userId } = telegramUser;
      const userRef = doc(db, 'telegramUsers', userId.toString());

      // Set updating flag
      isUpdatingRef.current = true;

      try {
        await updateDoc(userRef, {
          balance: accumulatedBalanceRef.current,
          energy: accumulatedEnergyRef.current,
          tapBalance: accumulatedTapBalanceRef.current,
        });

        // No need to update state here as it is already updated immediately in handleTap

        // Reset accumulated values to current state values
        accumulatedBalanceRef.current = balance;
        accumulatedEnergyRef.current = energy;
        accumulatedTapBalanceRef.current = tapBalance;
      } catch (error) {

      } finally {
        // Clear updating flag
        isUpdatingRef.current = false;
      }
    }
  };

  const formatNumber = (num) => {
    if (num < 100000) {
      return new Intl.NumberFormat().format(num).replace(/,/g, " ");
    } else if (num < 1000000) {
      return new Intl.NumberFormat().format(num).replace(/,/g, " ");
    } else {
      return (num / 1000000).toFixed(3).replace(".", ".") + " M";
    }
  };

  return (
    <>
      {loading ? (
        <Spinner />
      ) : (

        <Animate>
          <div className="flex flex-col justify-center w-full overflow-hidden relative">
            {/* Header Section */}
            <div className="flex items-center justify-start px-4 py-2">
              <div className="w-[25px]">
                {/* Display Current User's Profile Picture */}
                {window.Telegram.WebApp.initDataUnsafe?.user?.photo_url ? (
                  <img
                    src={window.Telegram.WebApp.initDataUnsafe.user.photo_url}
                    alt="Profile"
                    className="w-[20px] h-[20px] rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-white">
                    {username}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-white">{username}</p>
              <div className="flex items-center space-x-2 ml-4">
                <img alt="flash" src={flash} className="w-5 h-5" />
                <span className="text-sm font-bold slackey-regular text-white">
                  {typeof energy === 'number' ? energy.toFixed(0) : '0'}
                </span>
                <span className="text-sm font-bold slackey-regular text-white">/ {battery.energy}</span>
              </div>
            </div>

            {/* Daily Reward, Spinner, Leaderboard Section */}
            <div className="flex justify-between gap-2 px-4">
              {/* Daily Reward Card */}
              <div
                onClick={() => navigate("/earn/daily-reward")}
                className="bg-activebg border-[1px] border-activeborder rounded-lg px-0 py-1.5 w-1/3 relative flex flex-col items-center cursor-pointer transition-transform transform hover:scale-105"
                aria-label="Check Mianus - Daily Reward"
                role="button"
                tabIndex={0}
                onKeyPress={(e) => { if (e.key === 'Enter') navigate("/earn/daily-reward"); }}
              >
                <div className="dot"></div> {/* Ensure .dot class does not add extra space */}
                <img src={dailyReward} alt="Daily Reward" className="w-10 h-10 mb-1" />
                <p className="text-[11px] slackey-regular text-center text-white">Check Mianus</p>
              </div>
              {/* Spinner Card */}
              <div
                onClick={() => navigate("/earn/lucky")}
                className="bg-activebg border-[1px] border-activeborder rounded-lg px-3 py-1.5 w-1/3 relative flex flex-col items-center cursor-pointer transition-transform transform hover:scale-105"
                aria-label="Spin Mianus - Spinner"
                role="button"
                tabIndex={0}
                onKeyPress={(e) => { if (e.key === 'Enter') navigate("/earn/lucky"); }}
              >
                <div className="dot"></div>
                <img src={luckyWheel} alt="Spinner" className="w-10 h-10 mb-1" />
                <p className="text-[11px] slackey-regular text-center text-white">Spin Mianus</p>
              </div>
              {/* Leaderboard Card */}
              <div
                onClick={() => navigate("/user/leaderboard")}
                className="bg-activebg border-[1px] border-activeborder rounded-lg px-3 py-1.5 w-1/3 relative flex flex-col items-center cursor-pointer transition-transform transform hover:scale-105"
                aria-label="Rank Mianus - Leaderboard"
                role="button"
                tabIndex={0}
                onKeyPress={(e) => { if (e.key === 'Enter') navigate("/user/leaderboard"); }}
              >
                <div className="dot"></div>
                <img src={dailyCombo} alt="Leaderboard" className="w-10 h-10 mb-1" />
                <p className="text-[11px] slackey-regular text-center text-white">Rank Mianus</p>
              </div>
            </div>

            {/* Balance Section */}
            <div className="flex space-x-[2px] justify-center items-center">
              <div className="w-[50px] h-[50px]">
                <img 
                  src={isMouthOpen ? coinsmallOpen : coinsmallClosed} 
                  className="w-full transition-transform duration-100" 
                  alt="coin" 
                />
              </div>
              <h1 className="text-[#fff] text-[42px] slackey-regular font-extrabold">
                {formatNumber(balance + refBonus)}
              </h1>
            </div>
              
            {/* Main Tap Section */}
            <div className="relative flex items-center justify-center w-full pb-24 pt-7">
              
              <div className={`${tapGuru ? 'block' : 'hidden'} pyro`}>
                <div className="before"></div>
                <div className="after"></div>
              </div>
              <div className="relative flex items-center justify-center w-full h-full">
                <img 
                  src='/lihgt.webp'
                  alt='err' 
                  className={`absolute w-[330px] rotate-45 ${tapGuru ? 'block' : 'hidden'}`} 
                />

                <div className="image-container relative" ref={containerRef}>
                  {mainTap && (
                    <Container>
                      <WobbleImage
                        onTouchStart={handleTouchStart} // Specifically for touch devices
                        ref={imageRef}
                        src='/tswap.png'
                        alt="Wobble"
                        className={`wobble-image !w-[250px] select-none ${animationClass}`}
                      />
                      {clicks.map((click) => (
                        <SlideUpText key={click.id} x={click.x} y={click.y}>
                          +{tapGuru ? tapValue.value * 5 : tapValue.value}
                        </SlideUpText>
                      ))}
                    </Container>
                  )}
                  {tapGuru && (
                    <Container>
                      <WobbleImage
                        onTouchStart={handleTouchStartGuru} // Specifically for touch devices
                        ref={imageRef}
                        src='/tswap.png'
                        alt="Wobble"
                        className={`wobble-image !w-[250px] select-none ${animationClass}`}
                      />
                      {clicks.map((click) => (
                        <SlideUpText key={click.id} x={click.x} y={click.y}>
                          +{tapValue.value * 5}
                        </SlideUpText>
                      ))}
                    </Container>
                  )}

                  {/* Render Splashes using the new Splash component */}
                  {splashes.map((splash) => (
                    <Splash
                      key={splash.id}
                      x={splash.x}
                      y={splash.y}
                      onComplete={() => removeSplash(splash.id)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Levels Component */}
            <Levels showLevels={showLevels} setShowLevels={setShowLevels} />

            {/* Bubbles */}
            <div className="bubble-container">
              <div className="bubble"></div>
              <div className="bubble"></div>
              <div className="bubble"></div>
              <div className="bubble"></div>
              <div className="bubble"></div>
              <div className="bubble"></div>
              <div className="bubble"></div>
              <div className="bubble"></div>
              <div className="bubble"></div>
            </div>
          </div>
        </Animate>
      )}
    </>
  );
};

// Styled components for wobble animations (unchanged)
const wobbleLeftAnim = keyframes`
  0% { transform: rotate(0deg); }
  25% { transform: rotate(-7deg); }
  50% { transform: rotate(0deg); }
  75% { transform: rotate(-3deg); }
  100% { transform: rotate(0deg); }
`;

const wobbleRightAnim = keyframes`
  0% { transform: rotate(0deg); }
  25% { transform: rotate(7deg); }
  50% { transform: rotate(0deg); }
  75% { transform: rotate(3deg); }
  100% { transform: rotate(0deg); }
`;

const wobbleTopAnim = keyframes`
  0% { transform: translateY(0); }
  25% { transform: translateY(-7px); }
  50% { transform: translateY(0); }
  75% { transform: translateY(-3px); }
  100% { transform: translateY(0); }
`;

const wobbleBottomAnim = keyframes`
  0% { transform: translateY(0); }
  25% { transform: translateY(7px); }
  50% { transform: translateY(0); }
  75% { transform: translateY(3px); }
  100% { transform: translateY(0); }
`;

// Styled component for wobble animations
const WobbleImageStyled = styled.img`
  &.wobble-left {
    animation: ${wobbleLeftAnim} 0.3s;
    -webkit-animation: ${wobbleLeftAnim} 0.3s;
  }
  &.wobble-right {
    animation: ${wobbleRightAnim} 0.3s;
    -webkit-animation: ${wobbleRightAnim} 0.3s;
  }
  &.wobble-top {
    animation: ${wobbleTopAnim} 0.3s;
    -webkit-animation: ${wobbleTopAnim} 0.3s;
  }
  &.wobble-bottom {
    animation: ${wobbleBottomAnim} 0.3s;
    -webkit-animation: ${wobbleBottomAnim} 0.3s;
  }
`;

export default Plutos;
