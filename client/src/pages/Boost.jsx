import React, { useEffect, useState, useRef } from "react";
import Animate from "../Components/Animate.jsx";
import { Outlet, useNavigate } from "react-router-dom";
import coinsmall from "../images/coinsmall.webp";
import battery3 from "../images/battery.webp";
import multi from "../images/multi.webp";
import flash from "../images/flash.webp";
import full from "../images/full.webp";
import botr from "../images/bott.webp";
import boost from "../images/boost.webp";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.jsx'; // Adjust the path as needed
import { useUser } from "../context/userContext.jsx";
import { IoClose } from "react-icons/io5";
import { IoCheckmarkCircle } from "react-icons/io5";

const tapValues = [
  {
    level: 1,
    value: 1,
  },
  {
    level: 2,
    value: 2,
  },
  {
    level: 3,
    value: 3,
  },
  {
    level: 4,
    value: 4,
  },
  {
    level: 5,
    value: 5,
  },
  {
    level: 6,
    value: 6,
  },
  {
    level: 7,
    value: 7,
  },
  {
    level: 8,
    value: 8,
  },
  {
    level: 9,
    value: 9,
  },
  {
    level: 10,
    value: 10,
  },
  {
    level: 11,
    value: 11,
  },
  {
    level: 12,
    value: 12,
  },
  {
    level: 13,
    value: 13,
  },
  {
    level: 14,
    value: 14,
  },
];

const energyValues = [
  {
    level: 1,
    energy: 500,
  },
  {
    level: 2,
    energy: 1000,
  },
  {
    level: 3,
    energy: 1500,
  },
  {
    level: 4,
    energy: 2000,
  },
  {
    level: 5,
    energy: 2500,
  },
  {
    level: 6,
    energy: 3000,
  },
  {
    level: 7,
    energy: 3500,
  },
  {
    level: 8,
    energy: 4000,
  },
  {
    level: 9,
    energy: 4500,
  },
  {
    level: 10,
    energy: 5000,
  },
  {
    level: 11,
    energy: 5500,
  },
  {
    level: 12,
    energy: 6000,
  },
  {
    level: 13,
    energy: 6600,
  },
  {
    level: 14,
    energy: 7000,
  },
];

const chargingValues = [
  {
    level: 1,
    duration: 10,
    step: 600,
  },
  {
    level: 2,
    duration: 6,
    step: 360,
  },
  {
    level: 3,
    duration: 4,
    step: 240,
  },
  {
    level: 4,
    duration: 2,
    step: 120,
  },
  {
    level: 5,
    duration: 1,
    step: 60,
  },
]

const upgradeCosts = [0, 2000, 5000, 10000, 20000, 40000, 80000, 100000, 150000, 200000, 250000, 300000, 400000, 500000];

const energyUpgradeCosts = [0, 3000, 6000, 12000, 24000, 50000, 100000, 200000, 300000, 400000, 600000, 800000, 1000000, 2000000];

const chargingUpgradeCosts = [0, 2000, 30000, 100000, 200000];

const Boost = () => {

  const { balance, id, freeGuru, refiller, setRefiller, setFreeGuru, setTapGuru, fullTank, setFullTank, setMainTap, startTimer, timeRefill, setTimeRefill, tapValue, setTapValue, battery, setEnergy, setBattery, setBalance, refBonus, botLevel, setBotLevel, } = useUser();
  const [openInfo, setOpenInfo] = useState(false);
  const [openInfoTwo, setOpenInfoTwo] = useState(false);
  const [isUpgradeModalVisible, setIsUpgradeModalVisible] = useState(false);
  const [isUpgradeModalVisibleEn, setIsUpgradeModalVisibleEn] = useState(false);
  const [isUpgradeModalVisibleEnc, setIsUpgradeModalVisibleEnc] = useState(false);
  const [congrats, setCongrats] = useState(false)
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isUpgradingEn, setIsUpgradingEn] = useState(false);
  const [isUpgradingEnc, setIsUpgradingEnc] = useState(false);
  const [guru, setGuru] = useState(false);
  const [tank, setTank] = useState(false);
  const [bot, setBot] = useState(false);

  const tapBotLevels = [
    { level: 1, cost: 1000000, tapsPerSecond: 1 },
    { level: 2, cost: 2000000, tapsPerSecond: 2 },
    { level: 3, cost: 4000000, tapsPerSecond: 4 },
    { level: 4, cost: 8000000, tapsPerSecond: 8 },
    { level: 5, cost: 16000000, tapsPerSecond: 16 },
  ];
  // Determine the next bot level and its cost
  const nextBotLevel = (botLevel || 0) + 1;
  const nextBotData = tapBotLevels.find(levelData => levelData.level === nextBotLevel);
  const nextBotUpgradeCost = nextBotData ? nextBotData.cost : Infinity;

  // Compute if the user has enough balance for the next bot upgrade
  const hasSufficientBalanceForBotUpgrade = (balance + refBonus) >= nextBotUpgradeCost;

  const infoRef = useRef(null);
  const infoRefTwo = useRef(null);

  const handleClickOutside = (event) => {
    if (infoRef.current && !infoRef.current.contains(event.target)) {
      setOpenInfo(false);
    }
    if (infoRefTwo.current && !infoRefTwo.current.contains(event.target)) {
      setOpenInfoTwo(false);
    }
  };

  useEffect(() => {
    if (openInfo || openInfoTwo) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openInfo, openInfoTwo]);

  const formatNumber = (num) => {
    if (num < 100000) {
      return new Intl.NumberFormat().format(num).replace(/,/g, " ");
    } else if (num < 1000000) {
      return new Intl.NumberFormat().format(num).replace(/,/g, " ");
    } else {
      return (num / 1000000).toFixed(3).replace(".", ".") + " M";
    }
  };

  const getCurrentBotTPS = () => {
    const currentData = tapBotLevels.find(levelData => levelData.level === botLevel);
    return currentData ? currentData.tapsPerSecond : 0;
  };
  
  const getNextBotTPS = () => {
    const nextData = tapBotLevels.find(levelData => levelData.level === (botLevel || 0) + 1);
    return nextData ? nextData.tapsPerSecond : null;
  };

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    const nextLevel = tapValue.level;
    const upgradeCost = upgradeCosts[nextLevel];
    if (nextLevel < tapValues.length && (balance + refBonus) >= upgradeCost && id) {
      const newTapValue = tapValues[nextLevel];
      const userRef = doc(db, 'telegramUsers', id.toString());
      try {
        await updateDoc(userRef, {
          tapValue: newTapValue,
          balance: balance - upgradeCost
        });
        setTapValue(newTapValue);
        setBalance((prevBalance) => prevBalance - upgradeCost);
        setIsUpgrading(false);
        setIsUpgradeModalVisible(false);
        setCongrats(true)
        
        setTimeout(() => {
            setCongrats(false)
        }, 2000)
        console.log('Tap value upgraded successfully');
      } catch (error) {
        console.error('Error updating tap value:', error);
      }
    }
  };

  const handleEnergyUpgrade = async () => {
    setIsUpgradingEn(true);
    const nextEnergyLevel = battery.level;
    const energyUpgradeCost = energyUpgradeCosts[nextEnergyLevel];
    if (nextEnergyLevel< energyValues.length && (balance + refBonus) >= energyUpgradeCost && id) {
      const newEnergyValue = energyValues[nextEnergyLevel];
      const userRef = doc(db, 'telegramUsers', id.toString());
      try {
        await updateDoc(userRef, {
          battery: newEnergyValue,
          balance: balance - energyUpgradeCost,
          energy: newEnergyValue.energy
        });
        setBattery(newEnergyValue);
        localStorage.setItem('energy', newEnergyValue.energy);
        setEnergy(newEnergyValue.energy);
        setRefiller(newEnergyValue.energy);

        setBalance((prevBalance) => prevBalance - energyUpgradeCost);
        setIsUpgradingEn(false);
        setCongrats(true);
        setIsUpgradeModalVisibleEn(false);
        setTimeout(() => {
            setCongrats(false)
        }, 2000)
        console.log('Energy value upgraded successfully');
        console.log('Energy value upgraded successfully +', newEnergyValue.value);
        console.log('NEW REFILLER VALUES IS:', refiller)
      } catch (error) {
        console.error('Error updating energy value:', error);
      }
    }
  };

  const handlerRechargeUpgrade = async () => {
    setIsUpgradingEnc(true);
    const nextChargingLevel = timeRefill.level;
    const chargingUpgradeCost = chargingUpgradeCosts[nextChargingLevel];
    if (nextChargingLevel< chargingValues.length && (balance + refBonus) >= chargingUpgradeCost && id) {
      const newChargingValue = chargingValues[nextChargingLevel];
      const userRef = doc(db, 'telegramUsers', id.toString());
      try {
        await updateDoc(userRef, {
          timeRefill: newChargingValue,
          balance: balance - chargingUpgradeCost,
        });
        setTimeRefill(newChargingValue);
        setBalance((prevBalance) => prevBalance - chargingUpgradeCost);
        setIsUpgradingEnc(false);
        setEnergy(battery.energy);
        setCongrats(true)
        setIsUpgradeModalVisibleEnc(false);
        setTimeout(() => {
            setCongrats(false)
        }, 2000)
        console.log('Energy value upgraded successfully');
        console.log('Energy value upgraded successfully +', newChargingValue.value);
      } catch (error) {
        console.error('Error updating energy value:', error);
      }
    }
  };

  const nextUpgradeCost = upgradeCosts[tapValue.level];
  const hasSufficientBalance = (balance + refBonus) >= nextUpgradeCost;
  const nextEnergyUpgradeCost = energyUpgradeCosts[battery.level];
  const hasSufficientBalanceEn = (balance + refBonus) >= nextEnergyUpgradeCost;
  const nextChargingUpgradeCost = chargingUpgradeCosts[timeRefill.level];
  const hasSufficientBalanceEnc = (balance + refBonus) >= nextChargingUpgradeCost;
  const location = useNavigate();
  const [isDisabled, setIsDisabled] = useState(false);
  
  const handleTapGuru = async () => {
    if (id) {
      if (freeGuru > 0) {
        setIsDisabled(false);
        const newRemainingClicks = freeGuru - 1;
        setFreeGuru(newRemainingClicks);
        
        // Update the Firestore document
        const userRef = doc(db, 'telegramUsers', id.toString());
        await updateDoc(userRef, {
          freeGuru: newRemainingClicks,
          timeSta: new Date() 
        });
        startTimer();
        setMainTap(false);
        setTapGuru(true);
        location('/'); // Navigate to /home without refreshing the page
        setCongrats(true)
        setTimeout(() => {
          setCongrats(false)
      }, 2000)
      } else {
        setIsDisabled(true);
      }
    };
  };
 
  const handleFullTank = async () => {
    if (id) {
    if (fullTank > 0) {
      setIsDisabled(false);
      const newRemainingTank = fullTank - 1;
      setFullTank(newRemainingTank);
      
      // Update the Firestore document
      const userRef = doc(db, 'telegramUsers', id.toString());
      await updateDoc(userRef, {
        fullTank: newRemainingTank,
        timeStaTank: new Date() 
      });
      location('/'); // Navigate to /home without refreshing the page
      localStorage.setItem('energy', battery.energy);
      setEnergy(battery.energy);
      setRefiller(battery.energy);
      setCongrats(true)
      setTimeout(() => {
        setCongrats(false)
    }, 2000)
    } else {
      setIsDisabled(true);
    }
    };
  };

  const handleBotUpgrade = async () => {
    const nextLevelData = tapBotLevels.find(levelData => levelData.level === (botLevel || 0) + 1);
    if (!nextLevelData) return; // Already max level?
  
    const { cost } = nextLevelData;
    if ((balance + refBonus) >= cost && id) {
      const newBotLevel = (botLevel || 0) + 1;
      const userRef = doc(db, 'telegramUsers', id.toString());
      try {
        // Update Firestore
        await updateDoc(userRef, {
          botLevel: newBotLevel,
          balance: balance - cost,
        });
  
        // Retrieve updated data to sync local state
        const updatedDoc = await getDoc(userRef);
        if (updatedDoc.exists()) {
          const data = updatedDoc.data();
          setBalance(data.balance);
          setBotLevel(data.botLevel);
        }
  
        // Show success notice, then close modal after a bit
        setCongrats(true);
        setTimeout(() => {
          setCongrats(false);
        }, 2000);
  
        // Close the Bot modal
        setBot(false);
  
        console.log('Bot upgraded to level', newBotLevel);
      } catch (error) {
        console.error('Error upgrading bot level:', error);
      }
    } else {
      console.log('Insufficient funds or no next level available');
    }
  };
 
    const calculateTimeRemaining = () => {
    const now = new Date();
    const nextDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeDiff = nextDate - now;
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
  
    return { hours, minutes, seconds };
  };
  const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);
    
    return () => clearInterval(interval); // Clear interval on component unmount
  }, []);

  return (
    <>
      {/* {loading ? (
        <Spinner />
      ) : ( */}
        <Animate>
          <div className="flex-col justify-center w-full px-5 space-y-3">
            <div className="flex flex-col w-full">
              <div className="flex items-center justify-center w-full pb-2">
                <h2 className="text-[#fffff] slackey-regular text-[20px] font-medium">
                  Your Mianus Balance
                </h2>
              </div>
              <div className="flex space-x-1 ml-[-8px] justify-center items-center">
                <div className="w-[50px] h-[50px]">
                  <img src={coinsmall} className="w-full" alt="coin" />
                </div>
                <h1 className="text-[#fff] slackey-regular text-[42px] font-extrabold">
                  {formatNumber(balance + refBonus)}
                </h1>
              </div>
              <div>
      {/* <button className={`${freeGuru > 0 ? 'bg-btn' : 'bg-btn2'} py-3 px-3 rounded-[8px]`} onClick={handleClick} disabled={isDisabled}>
        Click me
      </button> */}

    </div>
              <div className="bg-borders w-full px-5 h-[1px] !mt-2 !mb-4"></div>

               <div className="flex flex-col w-full">
                <h3 className="text-[18px] slackey-regular font-semibold pb-4">
                  Your daily boosters:
                </h3>

                <div className="flex items-center justify-between w-full">
                  {/*  */}
                  <button
                  disabled={freeGuru <= 0}
                    onClick={() => setGuru(true)}
                    className={`${freeGuru > 0 ? 'opacity-100' : 'opacity-[.5]'}  bg-cards w-[48%] border-[1px] border-borders rounded-[8px] p-[8px] flex space-x-1`}
                  >
                    <div className="w-[40px] flex items-center justify-center">
                      <img src={boost} alt="boost" className={`w-full ${freeGuru > 0 ? '' : 'grayscale-[1]'}`} />
                    </div>

                    <div className="flex flex-col flex-1 text-left">
                      <span className="font-semibold slackey-regular tapguru">
                        Master
                      </span>
                      {freeGuru > 0 ? (
                    <span className="font-medium tapguru2">{freeGuru}/3</span>
                      ) : (
                        <span className="font-normal tapguru2">      
                      {timeRemaining.hours}h {timeRemaining.minutes}m {timeRemaining.seconds}s
                      </span>
                      )}
                   
                    </div>
                  </button>
                  {/*  */}
                  <button
                  disabled={fullTank <= 0}
                    onClick={() => setTank(true)}
                    className={`${fullTank > 0 ? 'opacity-100' : 'opacity-[.5]'} bg-cards w-[48%] border-[1px] border-borders rounded-[8px] p-[8px] flex`}
                  >
                    <div className="w-[40px] flex items-center justify-center">
                      <img src={full} alt="full" className={`w-[26px] ${fullTank > 0 ? '' : 'grayscale-[1]'}`} />
                    </div>

                    <div className="flex flex-col flex-1 text-left">
                      <span className="font-semibold slackey-regular tapguru">Full Juice</span>
                      {fullTank> 0 ? (
                <span className="font-medium tapguru2">{fullTank}/3</span>
                      ) : (
                        <span className="font-normal tapguru2">      
                      {timeRemaining.hours}h {timeRemaining.minutes}m {timeRemaining.seconds}s
                      </span>
                      )}
                   
                    </div>
                  </button>
                </div>

                <div className="flex flex-col w-full pt-4">
                  <h3 className="text-[18px] slackey-regular font-semibold">Boosters:</h3>
                </div>
              </div>
             </div>

             <div className="w-full flex flex-col h-[50vh] pt-2 pb-[60px] overflow-y-auto">
              <div
                className={`flex alltaskscontainer flex-col w-full space-y-2 pb-20`}
              >
                <button
                               onClick={() => setIsUpgradeModalVisible(true)}  
                               disabled={tapValue.level >= tapValues.length} 
                  className={`${tapValue.level >= tapValues.length ? 'opacity-[.7]' : 'opacity-100'} bg-activebg border-[1px] border-activeborder rounded-[10px] px-[14px] py-[5px] flex justify-between items-center`}
                >
                  <div className="flex items-center flex-1 space-x-2">
                    <div className="">
                      <img src={multi} alt="multi" className="w-[35px]" />
                    </div>
                    <div className="flex flex-col space-y-1 text-left">
                      <span className="font-semibold slackey-regular text-[17px]">
                        Boost Mianus
                      </span>
                      <div className="flex items-center space-x-1">
                        <span className="w-[20px] h-[20px]">
                          <img src={coinsmall} className="w-full" alt="coin" />
                        </span>
                        <span className="flex items-center font-medium">
                          <span className="text-[15px]">
                            
                          {tapValue.level >= tapValues.length ? (
              <>
              MAX
              </>
             ) : (
              <>
                {formatNumber(nextUpgradeCost)}
              </>
             )} 
                   
                       
                            
                            
                            </span>{" "}
                          <span className="bg-[#bdbdbd] w-[1px] h-[13px] mx-2"></span>
                          <span className="text-[#9a96a6] slackey-regular text-[15px]">
                            Level {tapValue.level}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/*  */}

                  <div className="">
                    <MdOutlineKeyboardArrowRight className="w-[20px] h-[20px] text-[#e0e0e0] mt-[2px]" />
                  </div>
                </button>

                {/*  */}

                <button
                             onClick={() => setIsUpgradeModalVisibleEn(true)} 
                             disabled={battery.level >= energyValues.length} 
                  className={`${battery.level >= energyValues.length ? 'opacity-[.7]' : 'opacity-100'} bg-activebg border-[1px] border-activeborder rounded-[10px] px-[14px] py-[5px] flex justify-between items-center`}
                >
                  <div className="flex items-center flex-1 space-x-2">
                    <div className="">
                      <img src={battery3} alt="battery" className="w-[35px]" />
                    </div>
                    <div className="flex flex-col space-y-1 text-left">
                      <span className="font-semibold slackey-regular text-[17px]">
                        Juice Limit
                      </span>
                      <div className="flex items-center space-x-1">
                        <span className="w-[20px] h-[20px]">
                          <img src={coinsmall} className="w-full" alt="coin" />
                        </span>
                        <span className="flex items-center font-medium">
                          <span className="text-[15px]">
                            
                          {battery.level >= energyValues.length ? (
              <>
              MAX
              </>
             ) : (
              <>
               {formatNumber(nextEnergyUpgradeCost)}
              </>
             )} 
                   

                        
                            
                            
                            </span>{" "}
                          <span className="bg-[#bdbdbd] w-[1px] h-[13px] mx-2"></span>
                          <span className="text-[#9a96a6] slackey-regular text-[15px]">
                            Level {battery.level}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/*  */}

                  <div className="">
                    <MdOutlineKeyboardArrowRight className="w-[20px] h-[20px] text-[#e0e0e0] mt-[2px]" />
                  </div>
                </button>

                {/*  */}
                <button onClick={() => setIsUpgradeModalVisibleEnc(true)} 
                                disabled={timeRefill.level >= chargingValues.length} 
                  className={`${timeRefill.level >= chargingValues.length ? 'opacity-[.7]' : 'opacity-100'} bg-activebg border-[1px] border-activeborder rounded-[10px] px-[14px] py-[5px] flex justify-between items-center`}
                >
                  <div className="flex items-center flex-1 space-x-2">
                    <div className="">
                      <img src={flash} alt="flash" className="w-[35px]" />
                    </div>
                    <div className="flex flex-col space-y-1 text-left">
                      <span className="font-semibold slackey-regular text-[17px]">
                        Juice refill rate
                      </span>
                      <div className="flex items-center space-x-1">
                        <span className="w-[20px] h-[20px]">
                          <img src={coinsmall} className="w-full" alt="coin" />
                        </span>
                        <span className="flex items-center font-medium">
                          <span className="text-[15px]">
                          {timeRefill.level >= chargingValues.length ? (<>MAX </> ) : ( <>  {formatNumber(nextChargingUpgradeCost)}  </> )} 
                         </span>{" "}
                          <span className="bg-[#bdbdbd] w-[1px] h-[13px] mx-2"></span>
                          <span className="text-[#9a96a6] slackey-regular text-[15px]">
                            Level {timeRefill.level}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                  {/*  */}
                  <div className="">
                    <MdOutlineKeyboardArrowRight className="w-[20px] h-[20px] text-[#e0e0e0] mt-[2px]" />
                  </div>
                </button>
                {/*  */}
                <button
                  onClick={() => setBot(true)}
                  className="bg-activebg border-[1px] border-activeborder rounded-[10px] px-[14px] py-[5px] flex justify-between items-center"
                >
                  <div className="flex items-center flex-1 space-x-2">
                    <div className="">
                      <img src={botr} alt="bot" className="w-[35px]" />
                    </div>
                    <div className="flex flex-col space-y-1 text-left">
                      <span className="font-semibold slackey-regular text-[17px]">Bot Mianus</span>
                      <div className="flex items-center space-x-1">
                      <span className="w-[20px] h-[20px]">
                        <img src={coinsmall} className="w-full" alt="coin" />
                      </span>
                      <span className="flex items-center font-medium">
                      <span className="text-[15px]">
                        {formatNumber(nextBotUpgradeCost)}
                      </span>
                      <span className="slackey-regular text-[#9a96a6] text-[15px]">
                        | Level {nextBotData?.level || 'Max'}
                      </span>
                    </span>
                    </div>
                    </div>
                  </div>

                  {/*  */}

                  <div className="">
                    <MdOutlineKeyboardArrowRight className="w-[20px] h-[20px] text-[#e0e0e0] mt-[2px]" />
                  </div>
                </button>

                {/*  */}
              </div>
             </div>
               {/* Multitap Modal */}
             <div
              className={`${
                isUpgradeModalVisible  === true ? "visible" : "invisible"
              } absolute bottom-0 left-0 right-0 h-fit bg-[#1e2340f7] z-[100] rounded-tl-[20px] rounded-tr-[20px] flex justify-center px-4 py-5`}>
              <div className="flex flex-col justify-between w-full py-8">
              <button onClick={() =>  setIsUpgradeModalVisible(false)} className="flex items-center justify-center absolute right-8 top-8 text-center rounded-[12px] font-medium text-[16px]" >
                     <IoClose size={24} className="text-[#9a96a6]"/>
                    </button>
                <div className="flex flex-col items-center justify-center w-full">
                  <div className="flex items-center justify-center">
                    <img alt="claim" src={multi} className="w-[100px]" />
                  </div>
                  <h3 className="font-semibold slackey-regular text-[32px] py-4">
                   Boost Mianus
                  </h3>
                  <p className="pb-6 text-[#9a96a6] slackey-regular text-[16px] text-center">
                  More of mianus per tap<br/> +1 per tap for each level
                  </p>
                  <div className="flex items-center flex-1 space-x-2">
                    <div className="">
                      <img
                        src={coinsmall}
                        className="w-[25px]"
                        alt="Coin Icon"
                      />
                    </div>
                    <div className="font-bold text-[26px] slackey-regular flex items-center">{formatNumber(nextUpgradeCost)} <span className="text-[16px] font-medium slackey-regular text-[#9a96a6] pl-2"> | Level {tapValues[tapValue.level]?.value} </span></div>
                  </div>
                </div>
                <div className="flex justify-center w-full pt-4 pb-6">
                  <button onClick={handleUpgrade} disabled={!hasSufficientBalance}
                    className={`${!hasSufficientBalance ? 'bg-btn2 slackey-regular text-[#979797]' : 'bg-gradient-to-b gradient from-[#ffba4c] to-[#aa6900]'} w-full py-5 px-3 flex items-center justify-center text-center rounded-[12px] slackey-regular font-semibold text-[22px]`} >
                    {isUpgrading ? 'Boosting...' : hasSufficientBalance ? 'Buy!' : 'Insufficient Mianus'}
                  </button>
                </div>
              </div>
             </div>
             {/* energylimit modal */}

             <div className={`${ isUpgradeModalVisibleEn  === true ? "visible" : "invisible"
              } absolute bottom-0 left-0 right-0 h-fit bg-[#1e2340f7] z-[100] rounded-tl-[20px] rounded-tr-[20px] flex justify-center px-4 py-5`}>
              <div className="flex flex-col justify-between w-full py-8">
              <button onClick={() =>  setIsUpgradeModalVisibleEn(false)}
                      className="flex items-center justify-center absolute right-8 top-8 text-center rounded-[12px] font-medium text-[16px]">
                     <IoClose size={24} className="text-[#9a96a6]"/>
                    </button>
                <div className="flex flex-col items-center justify-center w-full">
                  <div className=" flex items-center justify-center">
                    <img alt="claim" src={battery3} className="w-[100px]" />
                  </div>
                  <h3 className="font-semibold slackey-regular text-[32px] py-4">
                 Juice Limit
                  </h3>
                  <p className="pb-6 text-[#9a96a6] slackey-regular text-[16px] text-center">
                  Increase your max juice <br/> +500 juice storage for each level.
                  </p>

                  <div className="flex items-center flex-1 space-x-2">
                    <div className="">
                      <img
                        src={coinsmall}
                        className="w-[25px]"
                        alt="Coin Icon"
                      />
                    </div>
                    <div className="font-bold text-[26px] slackey-regular flex items-center">{formatNumber(nextEnergyUpgradeCost)} <span className="text-[16px] slackey-regular font-medium text-[#9a96a6] pl-2"> | Level {energyValues[battery.level]?.level} </span></div>
                  </div>
                </div>

                <div className="flex justify-center w-full pt-4 pb-6">
                  <button onClick={handleEnergyUpgrade} disabled={!hasSufficientBalanceEn}
                    className={`${!hasSufficientBalanceEn ? 'bg-btn2 slackey-regular text-[#979797]' : 'bg-gradient-to-b gradient from-[#ffba4c] to-[#aa6900]'} w-full py-5 px-3 flex items-center justify-center text-center rounded-[12px] slackey-regular font-semibold text-[22px]`}>
                    {isUpgrading ? 'Boosting...' : hasSufficientBalanceEn ? 'Buy!' : 'Insufficient Mianus'}
                  </button>
                </div>
              </div>
             </div>
             {/* charging modal */}

             <div
              className={`${ isUpgradeModalVisibleEnc  === true ? "visible" : "invisible"} 
              absolute bottom-0 left-0 right-0 h-fit bg-[#1e2340f7] z-[100] rounded-tl-[20px] rounded-tr-[20px] flex justify-center px-4 py-5`}>
              <div className="flex flex-col justify-between w-full py-8">
              <button onClick={() =>  setIsUpgradeModalVisibleEnc(false)} className="flex items-center justify-center absolute right-8 top-8 text-center rounded-[12px] font-medium text-[16px]">
                     <IoClose size={24} className="text-[#9a96a6]"/>
                    </button>
                <div className="flex flex-col items-center justify-center w-full">
                  <div className=" flex items-center justify-center">
                    <img alt="claim" src={flash} className="w-[100px]" />
                  </div>
                  <h3 className="font-semibold slackey-regular text-[32px] py-4">
                 Juice refill rate
                  </h3>
                  <p className="pb-6 text-[#9a96a6] slackey-regular text-[16px] text-center">
                  Higher level means juice refills faster.
                  </p>
                  <div className="flex items-center flex-1 space-x-2">
                    <div className="">
                      <img
                        src={coinsmall}
                        className="w-[25px]"
                        alt="Coin Icon"
                      />
                    </div>
                    <div className="font-bold slackey-regular text-[26px] flex items-center">{formatNumber(nextChargingUpgradeCost)} <span className="text-[16px] font-medium slackey-regular text-[#9a96a6] pl-2"> | level {chargingValues[timeRefill.level]?.level} </span></div>
                  </div>
                </div>

                <div className="flex justify-center w-full pt-4 pb-6">
                  <button onClick={handlerRechargeUpgrade}disabled={!hasSufficientBalanceEnc}
                    className={`${!hasSufficientBalanceEnc ? 'bg-btn2 text-[#979797] slackey-regular' : 'bg-gradient-to-b gradient from-[#ffba4c] to-[#aa6900]'} w-full py-5 px-3 flex items-center justify-center text-center rounded-[12px] slackey-regular font-semibold text-[22px]`}>
                    {isUpgrading ? 'Boosting...' : hasSufficientBalanceEnc ? 'Buy!' : 'Insufficient Mianus'}
                  </button>
                </div>
              </div>
             </div>
            
             {/* tapping Guru Modal */}
             <div
              className={`${
                guru  === true ? "visible" : "invisible"
              } absolute bottom-0 left-0 right-0 h-fit bg-[#1e2340f7] z-[100] rounded-tl-[20px] rounded-tr-[20px] flex justify-center px-4 py-5`}>
              <div className="flex flex-col justify-between w-full py-8">
              <button onClick={() =>  setGuru(false)} className="flex items-center justify-center absolute right-8 top-8 text-center rounded-[12px] font-medium text-[16px]"
                    > <IoClose size={24} className="text-[#9a96a6]"/>
                    </button>
                <div className="flex flex-col items-center justify-center w-full">
                  <div className=" flex items-center justify-center">
                    <img alt="claim" src={boost} className="w-[100px]" />
                  </div>
                  <h3 className="font-semibold slackey-regular text-[32px] py-4">
                 Master Mianus
                  </h3>
                  <p className="pb-6 text-[#9a96a6] slackey-regular text-[16px] text-center">
                 Tap Mianus at 5X power for 20 seconds! No juice used while active.
                  </p>
                  <div className="flex items-center flex-1 space-x-2">
                    <div className="">
                      <img
                        src={coinsmall}
                        className="w-[25px]"
                        alt="Coin Icon"
                      />
                    </div>
                    <div className="font-bold text-[26px] flex items-center">Free</div>
                  </div>
                </div>
                <div className="flex justify-center w-full pt-4 pb-6">
                  <button
                  onClick={handleTapGuru}className={`bg-gradient-to-b gradient slackey-regular from-[#ffba4c] to-[#aa6900] w-full py-5 px-3 flex items-center justify-center text-center rounded-[12px] font-semibold text-[22px]`}>
                   Buy!
                  </button>
                </div>
              </div>
             </div>

             {/* full tank Model */}
             <div
              className={`${
                tank  === true ? "visible" : "invisible"
              } absolute bottom-0 left-0 right-0 h-fit bg-[#1e2340f7] z-[100] rounded-tl-[20px] rounded-tr-[20px] flex justify-center px-4 py-5`} >
              <div className="flex flex-col justify-between w-full py-8">
              <button onClick={() =>  setTank(false)} className="flex items-center justify-center absolute right-8 top-8 text-center rounded-[12px] font-medium text-[16px]">
                     <IoClose size={24} className="text-[#9a96a6]"/>
                    </button>
                <div className="flex flex-col items-center justify-center w-full">
                  <div className=" flex items-center justify-center">
                    <img alt="claim" src={boost} className="w-[100px]" />
                  </div>
                  <h3 className="font-semibold slackey-regular text-[32px] py-4">
                Full Juice
                  </h3>
                  <p className="pb-6 text-[#9a96a6] slackey-regular text-[16px] text-center">
                Refill juice tank to max juice
                  </p>
                  <div className="flex items-center flex-1 space-x-2">
                    <div className="">
                      <img
                        src={coinsmall}
                        className="w-[25px]"
                        alt="Coin Icon"
                      />
                    </div>
                    <div className="font-bold text-[26px] flex items-center">Free</div>
                  </div>
                </div>

                <div className="flex justify-center w-full pt-4 pb-6">
                  <button onClick={handleFullTank} className={`bg-gradient-to-b gradient slackey-regular from-[#ffba4c] to-[#aa6900] w-full py-5 px-3 flex items-center justify-center text-center rounded-[12px] font-semibold text-[22px]`}
                  >Buy!
                  </button>
                </div>
              </div>
             </div>

              {/* Bot Modal */}
<div
  className={`${bot ? "visible" : "invisible"} 
    absolute bottom-0 left-0 right-0 h-fit bg-[#1e2340f7] 
    z-[100] rounded-tl-[20px] rounded-tr-[20px] flex justify-center px-4 py-5`}
>
  <div className="flex flex-col justify-between w-full py-8 relative">
    <button
      onClick={() => setBot(false)}
      className="flex items-center justify-center absolute right-8 top-8"
    >
      <IoClose size={24} className="text-[#9a96a6]" />
    </button>

    <div className="flex flex-col items-center justify-center w-full">
      {/* The content you already have */}
      <div className="flex items-center justify-center">
        <img alt="Bot Mianus" src={botr} className="w-[100px]" />
      </div>
      <h3 className="font-semibold slackey-regular text-[32px] py-4">
        Bot Mianus
      </h3>
      <p className="pb-6 text-[#9a96a6] slackey-regular text-[16px] text-center">
        Tap Bot will tap indefinitely on your behalf.
      </p>

      {/* Current/Next TPS, etc. */}
      <div className="pb-4 text-[#9a96a6] text-center">
        <p>Current TPS: {getCurrentBotTPS() || 0}</p>
        {nextBotData && (
          <p>Next Level TPS: {nextBotData.tapsPerSecond}</p>
        )}
      </div>

      <div className="flex items-center flex-1 space-x-2">
        <div>
          <img src={coinsmall} className="w-[25px]" alt="coin" />
        </div>
        <div className="font-bold text-[26px] slackey-regular flex items-center">
          {formatNumber(nextBotUpgradeCost)}
          <span className="text-[16px] font-medium slackey-regular text-[#9a96a6] pl-2">
            | Level {nextBotData?.level}
          </span>
        </div>
      </div>
    </div>

    <div className="flex justify-center w-full pt-4 pb-6">
      <button
        onClick={handleBotUpgrade}
        disabled={!hasSufficientBalanceForBotUpgrade}
        className={
          !hasSufficientBalanceForBotUpgrade
            ? "bg-btn2 text-[#979797] slackey-regular w-full py-5 ..."
            : "bg-gradient-to-b gradient from-[#ffba4c] to-[#aa6900] w-full py-5 ..."
        }
      >
        {hasSufficientBalanceForBotUpgrade ? "Buy Bot Upgrade" : "Insufficient Mianus"}
      </button>
    </div>
  </div>
</div>

            <div className={`${congrats === true ? "visible bottom-6" : "invisible bottom-[-10px]"} z-[60] ease-in duration-300 w-full fixed left-0 right-0 px-4`}>
              <div className="w-full text-[#54d192] flex items-center space-x-2 px-4 bg-[#121620ef] h-[50px] rounded-[8px]">
              <IoCheckmarkCircle size={24} className=""/>
              <span className="font-medium slackey-regular">
                Booster Applied!
              </span>
              </div>
            </div>
{isUpgradingEn && ( <> </>)}{isUpgradingEnc && (<></>)}{isDisabled && (<></>)}

          </div>
          <Outlet />
        </Animate>
      {/* )} */}
    </>
  );
};

export default Boost;
