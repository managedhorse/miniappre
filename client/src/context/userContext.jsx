//userContext.jsx:
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc, addDoc, serverTimestamp, arrayUnion, getDocs, collection, query, limit, orderBy, getCountFromServer, getAggregateFromServer, sum } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust the path as needed
import { disableReactDevTools } from '@fvilers/disable-react-devtools';

if (import.meta.NODE_ENV === 'production') {
  disableReactDevTools();
}

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [balance, setBalance] = useState(0);
  // const [totalBalance, setTotalBalance] = useState(0);
  const [tapBalance, setTapBalance] = useState(0);
  const [level, setLevel] = useState({ id: 1, name: "Level 1", imgUrl: '/lvl1.webp' }); // Initial level as an object with id and name
  const [tapValue, setTapValue] = useState({level: 1, value: 1});
  const [timeRefill, setTimeRefill] = useState({level: 1, duration: 10, step: 600});
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(true);
  const [energy, setEnergy] = useState(500);
  const [openInfoTwo, setOpenInfoTwo] = useState(false);
  const [battery, setBattery] = useState({level: 1, energy: 500});
  const [initialized, setInitialized] = useState(false);
  const [refBonus, SetRefBonus] = useState(0);
  const [manualTasks, setManualTasks] = useState([]);
  const [userManualTasks, setUserManualTasks] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]); // State to hold completed tasks
  const [claimedMilestones, setClaimedMilestones] = useState([]);
  const [claimedReferralRewards, setClaimedReferralRewards] = useState([]);
  const [referrals, setReferrals] = useState([]); // State to hold referrals
  const telegramUser = window.Telegram.WebApp.initDataUnsafe?.user;
  const [refiller, setRefiller] = useState(0);
  const [ count, setCount ] = useState(0);
  const [tapGuru, setTapGuru] = useState(false);
  const [mainTap, setMainTap] = useState(true);
  const [time, setTime] = useState(22);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [freeGuru, setFreeGuru] = useState(3);
  const [fullTank, setFullTank] = useState(3);
  const [timeSta, setTimeSta] = useState(null);
  const [timeStaTank, setTimeStaTank] = useState(null);
  const [timeSpin, setTimeSpin] = useState(new Date());
  const [timeDailyReward, setTimeDailyReward] = useState(null);
  const [dailyReward, setDailyReward] = useState(0);
  const [username, setUsername] = useState("");
  // eslint-disable-next-line
  const [idme, setIdme] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [dividedCount, setDividedCount] = useState(0);
  const [users, setUsers] = useState(0);
  const [dividedUsers, setDividedUsers] = useState(0);
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [taskCompleted2, setTaskCompleted2] = useState(false);
  const [leaderboard, SetLeaderboard] = useState([]);
  const [rankUser, setRankUser] = useState(0);
  const [botLevel, setBotLevel] = useState(0);
  const refillIntervalRef = useRef(null);
  const accumulatedEnergyRef = useRef(energy);
  const [isRefilling, setIsRefilling] = useState(false);
  const refillDuration = timeRefill.duration * 60 * 1000; // 2 minutes in milliseconds
  const refillSteps = timeRefill.step; // Number of increments
  const incrementValue = refiller / refillSteps; // Amount to increment each step
  const defaultEnergy = refiller; // Default energy value
  const tapBotLevels = [
    { level: 1, cost: 1000000, tapsPerSecond: 1 },
    { level: 2, cost: 2000000, tapsPerSecond: 2 },
    { level: 3, cost: 4000000, tapsPerSecond: 4 },
    { level: 4, cost: 8000000, tapsPerSecond: 8 },
    { level: 5, cost: 16000000, tapsPerSecond: 16 },
  ];
  
  const [unsavedEarnings, setUnsavedEarnings] = useState(0);
  const lastEarningsUpdateKey = "lastEarningsUpdate";
  const unsavedEarningsKey = "unsavedEarnings";
  const balanceRef = useRef(balance);
  const tapBalanceRef = useRef(tapBalance);
  const unsavedEarningsRef = useRef(unsavedEarnings);

  // New effect to read stored unsaved earnings on mount
useEffect(() => {
  const storedEarnings = localStorage.getItem(unsavedEarningsKey);
  const unsaved = storedEarnings ? parseFloat(storedEarnings) : 0;

  if (unsaved > 0) {
    setBalance(prevBalance => prevBalance + unsaved);
    setTapBalance(prevTapBalance => prevTapBalance + unsaved);
    setUnsavedEarnings(0);
    localStorage.setItem(unsavedEarningsKey, "0");
  }
}, []);
  
  const refillEnergy = () => {
    if (isRefilling) return;
  
    setIsRefilling(true);
    refillIntervalRef.current = setInterval(() => {
      setEnergy((prevEnergy) => {
        if (isNaN(prevEnergy) || prevEnergy >= refiller) {
          clearInterval(refillIntervalRef.current);
          setIsRefilling(false);
          return refiller;
        }
        const newEnergy = Math.min(prevEnergy + incrementValue, refiller); // Ensure energy doesn't exceed max
        if (!isNaN(newEnergy)) {
          accumulatedEnergyRef.current = newEnergy;
          localStorage.setItem('energy', newEnergy); // Save updated energy to local storage
          localStorage.setItem('lastRefillTime', Date.now()); // Save the current time
          console.log('Energy saved to local storage:', newEnergy); // Log the energy value saved to local storage
        }
  
        return newEnergy;
      });
    }, refillDuration / refillSteps); // Increase energy at each step
  };


useEffect(() => { balanceRef.current = balance; }, [balance]);
useEffect(() => { tapBalanceRef.current = tapBalance; }, [tapBalance]);
useEffect(() => { unsavedEarningsRef.current = unsavedEarnings; }, [unsavedEarnings]);

useEffect(() => {
  if (botLevel > 0) {
    const botData = tapBotLevels.find(l => l.level === botLevel);
    if (!botData) return;
    const interval = setInterval(() => {
      // Update the displayed balance and tapBalance for immediate UI feedback
      setBalance(prev => prev + botData.tapsPerSecond);
      setTapBalance(prev => prev + botData.tapsPerSecond);
      
      // Also accumulate unsaved earnings for Firestore batching
      setUnsavedEarnings(prev => {
        const newEarnings = prev + botData.tapsPerSecond;
        localStorage.setItem(unsavedEarningsKey, newEarnings.toString());
        return newEarnings;
      });
    }, 1000);
    return () => clearInterval(interval);
  }
}, [botLevel]);

  useEffect(() => {
    if (!id) return; // Ensure 'id' is set before starting the interval
  
    const updateInterval = setInterval(async () => {
      const currentUnsaved = unsavedEarningsRef.current;
      // Only update if there are earnings to save
      if (currentUnsaved > 0) {
        try {
          const userRef = doc(db, 'telegramUsers', id.toString());
          // Use the refs to access the latest balance and tapBalance
          const updatedBalance = balanceRef.current + currentUnsaved;
          const updatedTapBalance = tapBalanceRef.current + currentUnsaved;
          await updateDoc(userRef, {
            balance: updatedBalance,
            tapBalance: updatedTapBalance,
          });
          // Update local state after successful Firestore update
          setBalance(updatedBalance);
          setTapBalance(updatedTapBalance);
          setUnsavedEarnings(0);
          localStorage.setItem(unsavedEarningsKey, "0");
          localStorage.setItem(lastEarningsUpdateKey, Date.now().toString());
        } catch (error) {
          console.error("Error batching tapbot earnings:", error);
        }
      }
    }, 2 * 60 * 1000); // 2 minutes
  
    return () => clearInterval(updateInterval);
  }, [id]);
  

  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem(lastEarningsUpdateKey, Date.now().toString());
      localStorage.setItem('lastBalance', balance.toString());
      localStorage.setItem('lastTapBalance', tapBalance.toString());
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [balance, tapBalance]);

  useEffect(() => {
    if (id && botLevel > 0) {
      // Calculate missed earnings
      const lastUpdate = localStorage.getItem(lastEarningsUpdateKey);
      if (lastUpdate) {
        const lastTime = parseInt(lastUpdate, 10);
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - lastTime) / 1000);
        const botData = tapBotLevels.find(l => l.level === botLevel);
        if (botData) {
          const missedEarnings = elapsedSeconds * botData.tapsPerSecond;
          setUnsavedEarnings(missedEarnings);
          localStorage.setItem(unsavedEarningsKey, missedEarnings.toString());
        }
      }
  
      // Now apply unsaved earnings if any
      const storedEarnings = localStorage.getItem(unsavedEarningsKey);
      const unsaved = storedEarnings ? parseFloat(storedEarnings) : 0;
      if (unsaved > 0) {
        const newBalance = balance + unsaved;
        const newTapBalance = tapBalance + unsaved;
  
        setBalance(newBalance);
        setTapBalance(newTapBalance);
        setUnsavedEarnings(0);
        localStorage.setItem(unsavedEarningsKey, "0");
  
        const telegramUser = window.Telegram.WebApp.initDataUnsafe?.user;
        if (telegramUser) {
          const { id: userId } = telegramUser;
          const userRef = doc(db, 'telegramUsers', userId.toString());
          updateDoc(userRef, {
            balance: newBalance,
            tapBalance: newTapBalance,
          }).catch((error) => {
            console.error("Error updating Firestore with passive earnings:", error);
          });
        }
      }
    }
  }, [id, botLevel]);
  

  useEffect(() => {
    if (energy < refiller && !isRefilling) {
      refillEnergy();
      // console.log('REFILLER IS', refiller)
    }
      // eslint-disable-next-line
  }, [energy, isRefilling]);
  
  useEffect(() => {
    return () => {
      clearInterval(refillIntervalRef.current);
    };
  }, []);
  

  
  useEffect(() => {
    let timerId;
    if (isTimerRunning && time > 0) {
      timerId = setInterval(() => {
        setTime(prevTime => prevTime - 1);
      }, 1000);
    } else if (time === 0) {
      setTapGuru(false);
      setMainTap(true);
    }
    return () => clearInterval(timerId);
  }, [isTimerRunning, time]);

  const startTimer = useCallback(() => {
    setTime(22);
    setTapGuru(true);
    setIsTimerRunning(true);
  }, []);

  

  const sendUserData = async () => {
    const queryParams = new URLSearchParams(window.location.search);
    let referrerId = queryParams.get("start");
    if (referrerId) {
      referrerId = referrerId.replace(/\D/g, "");
    }
  
    if (telegramUser) {
      const { id: userId, username, first_name: firstName, last_name: lastName, photo_url } = telegramUser;
  
      // Use first name and ID as username if no Telegram username exists
      const finalUsername = username || `${firstName}_${userId}`;
  
      try {
        const userRef = doc(db, 'telegramUsers', userId.toString());
        const userDoc = await getDoc(userRef);
  
        // Read unsaved earnings from localStorage
        const storedEarnings = localStorage.getItem(unsavedEarningsKey);
        const unsaved = storedEarnings ? parseFloat(storedEarnings) : 0;
  
        if (userDoc.exists()) {
          console.log('User already exists in Firestore');
          const userData = userDoc.data();
  
          // Update the photo_url if it has changed
          if (userData.photo_url !== photo_url) {
            await updateDoc(userRef, { photo_url });
          }
  
          // Read unsaved earnings and stored balances from localStorage
          const storedEarnings = parseFloat(localStorage.getItem(unsavedEarningsKey)) || 0;
          const storedBalance = parseFloat(localStorage.getItem('lastBalance')) || 0;
          const storedTapBalance = parseFloat(localStorage.getItem('lastTapBalance')) || 0;
  
          // Incorporate unsaved earnings into Firestore data
          userData.balance = (userData.balance || 0) + storedEarnings;
          userData.tapBalance = (userData.tapBalance || 0) + storedEarnings;
  
          // Use the larger of Firestore and locally stored balances
          userData.balance = Math.max(userData.balance, storedBalance);
          userData.tapBalance = Math.max(userData.tapBalance, storedTapBalance);
  
          // Update Firestore and local state
          await updateDoc(userRef, {
            balance: userData.balance,
            tapBalance: userData.tapBalance
          });
  
          setBalance(userData.balance);
          setTapBalance(userData.tapBalance);
          setTapValue(userData.tapValue);
          setFreeGuru(userData.freeGuru);
          setFullTank(userData.fullTank);
          setTimeSta(userData.timeSta);
          setTimeStaTank(userData.timeStaTank);
          setTimeSpin(userData.timeSpin);
          setTimeDailyReward(userData.timeDailyReward);
          setDailyReward(userData.dailyReward);
          setClaimedMilestones(userData.claimedMilestones || []);
          setClaimedReferralRewards(userData.claimedReferralRewards || []);
          setBattery(userData.battery);
          setRefiller(userData.battery.energy);
          setTimeRefill(userData.timeRefill);
          setLevel(userData.level);
          setBotLevel(userData.botLevel || 0);
          setId(userData.userId);
          SetRefBonus(userData.refBonus || 0);
  
          const lastReferralsUpdate = localStorage.getItem("lastReferralsUpdate");
        const now = Date.now();
        const TWELVE_HOURS = 12 * 60 * 60 * 1000;

        if (!lastReferralsUpdate || now - Number(lastReferralsUpdate) > TWELVE_HOURS) {
          await updateReferrals(userRef);
          localStorage.setItem("lastReferralsUpdate", String(now));
        }
  
          setInitialized(true);
          setLoading(false);
          fetchData(userData.userId); // Fetch data for the existing user
  
          // After applying unsaved earnings, reset them
          setUnsavedEarnings(0);
          localStorage.setItem(unsavedEarningsKey, "0");
  
          // Calculate and incorporate unsaved earnings after loading user data
          calculateMissedEarnings();
          // Read the newly calculated unsaved earnings
          const newStoredEarnings = localStorage.getItem(unsavedEarningsKey);
          const newUnsaved = newStoredEarnings ? parseFloat(newStoredEarnings) : 0;
  
          if (newUnsaved > 0) {
            // Update balance and tapBalance with missed earnings
            setBalance(prev => prev + newUnsaved);
            setTapBalance(prev => prev + newUnsaved);
            // Reset unsaved earnings after applying them
            setUnsavedEarnings(0);
            localStorage.setItem(unsavedEarningsKey, "0");
          }
  
          console.log("Battery is:", userData.battery.energy);
          return;
        }

        const userData = {
          userId: userId.toString(),
          username: finalUsername,
          firstName,
          lastName,
          photo_url,
          totalBalance: 0,
          balance: 0,
          freeGuru: 3,
          fullTank: 3,
          tapBalance: 0,
          timeSta: null,
          timeStaTank: null,
          timeSpin: new Date("2024-01-01"),
          timeDailyReward : new Date("2024-01-01"),
          dailyReward: 0,
          tapValue: {level: 1, value: 1},
          timeRefill: {level: 1, duration: 10, step: 600},
          level: { id: 1, name: "Level 1", imgUrl: '/lvl1.webp' }, // Set the initial level with id and name
          energy: 500,
          battery: {level: 1, energy: 500},
          refereeId: referrerId || null,
          referrals: [],
          botLevel: 0,
        };

        await setDoc(userRef, userData);
        console.log('User saved in Firestore');
        setEnergy(500);
        setBattery(userData.battery);
        setRefiller(userData.battery.energy);
        setTapValue(userData.tapValue);
        setTimeRefill(userData.timeRefill);
        setFreeGuru(userData.freeGuru);
        setFullTank(userData.fullTank);
        setId(userId.toString()); // Set the id state for the new user

        if (referrerId) {
          const referrerRef = doc(db, 'telegramUsers', referrerId);
          const referrerDoc = await getDoc(referrerRef);
          if (referrerDoc.exists()) {
            await updateDoc(referrerRef, {
              referrals: arrayUnion({
                userId: userId.toString(),
                username: finalUsername,
                balance: 0,
                level: { id: 1, name: "Level 1", imgUrl: '/lvl1.webp' }, // Include level with id and name
              })
            });
            console.log('Referrer updated in Firestore');
          }
        }
        
        setInitialized(true);
        setLoading(false);
        fetchData(userId.toString()); // Fetch data for the new user

      } catch (error) {
        console.error('Error saving user in Firestore:', error);
      }
    }
  };


  const updateReferrals = async (userRef) => {
    try {
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      if (!userData) {
        console.error("User data not found for:", userRef.id);
        return;
      }
  
      const referrals = userData.referrals || [];
  
      // Map through each referral in the array.
      // We'll fetch the referral's doc to get their 'balance' and 'refBonus'.
      const updatedReferrals = await Promise.all(
        referrals.map(async (referral) => {
          const referralRef = doc(db, "telegramUsers", referral.userId);
          const referralDoc = await getDoc(referralRef);
  
          if (!referralDoc.exists()) {
            console.error(`Referral doc not found for userId: ${referral.userId}`);
            return referral; // Return the existing referral if doc is missing
          }
  
          const referralData = referralDoc.data();
          // The fields of interest:
          const theirBalance = referralData.balance || 0;   // The referred user's main balance
          const theirRefBonus = referralData.refBonus || 0; // The referred user's own ref bonus (if you want to add it)
  
          // If you want the referral's "balance" in the referrer's doc
          // to reflect 10% of (theirBalance + theirRefBonus):
          const combined = theirBalance + theirRefBonus;
          const tenPercent = combined * 0.1; 
  
          // Return updated referral object
          return {
            ...referral,
            // We store the 10% in the referral's 'balance' field
            balance: tenPercent,
            // If you still want to show their level / photo:
            level: referralData.level,
            photo_url: referralData.photo_url,
          };
        })
      );
  
      // Now update the referrer's document with the new referrals array
      await updateDoc(userRef, {
        referrals: updatedReferrals,
      });
  
      // Calculate the sum of all referral balances that we just updated
      const totalEarnings = updatedReferrals.reduce((acc, curr) => acc + (curr.balance || 0), 0);
      // The referrer’s own “refBonus” is presumably 10% of the sum of these new values:
      const refBonus = Math.floor(totalEarnings);
  
      console.log(`Total earnings: ${totalEarnings}, Referrer bonus: ${refBonus}`);
  
      // Update refBonus in Firestore
      await updateDoc(userRef, {
        refBonus,
        // No more totalBalance if it’s deprecated, so we remove it
      });
  
      console.log("Referrals and refBonus updated successfully for:", userRef.id);
    } catch (error) {
      console.error("Error updating referrals:", error);
    }
  };

  const fetchData = async (userId) => {
    if (!userId) return; // Ensure userId is set
    try {
      // Fetch tasks
      const tasksQuerySnapshot = await getDocs(collection(db, 'tasks'));
      const tasksData = tasksQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(tasksData);

      // Fetch user data
      const userDocRef = doc(db, 'telegramUsers', userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setCompletedTasks(userData.tasksCompleted || []);
        setUserManualTasks(userData.manualTasks || []);
      }

      // Fetch manual tasks
      const manualTasksQuerySnapshot = await getDocs(collection(db, 'manualTasks'));
      const manualTasksData = manualTasksQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setManualTasks(manualTasksData);

    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  const fetchReferrals = async () => {
    const telegramUser = window.Telegram.WebApp.initDataUnsafe?.user;
    if (telegramUser) {
      const { id: userId } = telegramUser;
      const userRef = doc(db, 'telegramUsers', userId.toString());
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        setReferrals(userData.referrals || []);
      }
      setLoading(false);
    }
  };

  const updateUserLevel = async (userId, newTapBalance) => {
    let newLevel = { id: 1, name: "Level 1", imgUrl: "/lvl1.webp" };

    if (newTapBalance >= 1000 && newTapBalance < 50000) {
      newLevel = { id: 2, name: "Level 2", imgUrl: "/lvl2.webp" };
    } else if (newTapBalance >= 50000 && newTapBalance < 500000) {
      newLevel = { id: 3, name: "Level 3", imgUrl: "/lvl3.webp" };
    } else if (newTapBalance >= 500000 && newTapBalance < 1000000) {
      newLevel = { id: 4, name: "Level 4", imgUrl: "/lvl4.webp" };
    } else if (newTapBalance >= 1000000 && newTapBalance < 2500000) {
      newLevel = { id: 5, name: "Level 5", imgUrl: "/lvl5.webp" };
    } else if (newTapBalance >= 2500000) {
      newLevel = { id: 6, name: "Level 6", imgUrl: "/lvl6.webp" };
    }

    if (newLevel.id !== level.id) {
      setLevel(newLevel);
      const userRef = doc(db, 'telegramUsers', userId);
      await updateDoc(userRef, { level: newLevel });
      console.log(`User level updated to ${newLevel.name}`);
    }
  };
  

  useEffect(() => {
    sendUserData();
     // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (id) {
      const storedEnergy = localStorage.getItem('energy');
      const lastRefillTime = localStorage.getItem('lastRefillTime');
    
      if (storedEnergy && lastRefillTime) {
        const energyValue = Number(storedEnergy);
        const lastTime = Number(lastRefillTime);
    
        if (!isNaN(energyValue) && energyValue >= 0 && !isNaN(lastTime) && lastTime > 0) {
          const elapsedTime = Date.now() - lastTime;
          const elapsedSteps = Math.floor(elapsedTime / (refillDuration / refillSteps));
          const restoredEnergy = Math.min(energyValue + elapsedSteps * incrementValue, refiller);
    
          if (!isNaN(restoredEnergy) && restoredEnergy >= 0) {
            setEnergy(restoredEnergy);
            localStorage.setItem('energy', restoredEnergy); // Update the stored energy
            localStorage.setItem('lastRefillTime', Date.now()); // Update the last refill time
    
            if (restoredEnergy < refiller) {
              setIsRefilling(false);
              refillEnergy();
            }
          }
        } else {
          // If stored energy or last time is invalid, reset energy to default value
          setEnergy(defaultEnergy);
          localStorage.setItem('energy', defaultEnergy);
          localStorage.setItem('lastRefillTime', Date.now());
        }
      } else if (storedEnergy) {
        const energyValue = Number(storedEnergy);
        if (!isNaN(energyValue) && energyValue >= 0) {
          setEnergy(energyValue);
        } else {
          setEnergy(defaultEnergy);
          localStorage.setItem('energy', defaultEnergy);
          localStorage.setItem('lastRefillTime', Date.now());
        }
      } else {
        setEnergy(defaultEnergy);
        localStorage.setItem('energy', defaultEnergy);
        localStorage.setItem('lastRefillTime', Date.now());
      }
  
      fetchData(id);
      console.log('MY REFIILER IS:', refiller)
    }
      // eslint-disable-next-line
  }, [id]);

  const checkAndUpdateFreeGuru = async () => {
    const userRef = doc(db, 'telegramUsers', id.toString());
    const userDoc = await getDoc(userRef);
  
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const lastDate = userData.timeSta.toDate(); // Convert Firestore timestamp to JS Date
      const formattedDates = lastDate.toISOString().split('T')[0]; // Get the date part in YYYY-MM-DD format
      const currentDate = new Date(); // Get the current date
      const formattedCurrentDates = currentDate.toISOString().split('T')[0]; // Get the date part in YYYY-MM-DD format
      // const timeDifference = (currentTime - lastTimeSta) / 1000; // Time difference in seconds
      // console.log('timesta is:', lastDate)
      // console.log('current time is:', currentDate)
      // console.log('time difference is:', timeDifference)
  
      if (formattedDates !== formattedCurrentDates && userData.freeGuru <= 0) {
        await updateDoc(userRef, {
          freeGuru: 3,
          timeSta: new Date()

        });
        setFreeGuru(3);
      }
    }
  };

  const checkAndUpdateFullTank = async () => {
    const userRef = doc(db, 'telegramUsers', id.toString());
    const userDoc = await getDoc(userRef);
  
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const lastDateTank = userData.timeStaTank.toDate(); // Convert Firestore timestamp to JS Date
      const formattedDate = lastDateTank.toISOString().split('T')[0]; // Get the date part in YYYY-MM-DD format
      const currentDate = new Date(); // Get the current date
      const formattedCurrentDate = currentDate.toISOString().split('T')[0]; // Get the date part in YYYY-MM-DD format

      // const timeDifference = (currentTime - lastTimeSta) / 1000; // Time difference in seconds
      console.log('timesta is:', lastDateTank)
      console.log('formated timesta is:', formattedDate)
      console.log('current time is:', currentDate)
      console.log('formatted current time is:', formattedCurrentDate)
      // console.log('time difference is:', timeDifference)
  
      if (formattedDate !== formattedCurrentDate && userData.fullTank <= 0) {
        await updateDoc(userRef, {
          fullTank: 3,
          timeStaTank: new Date()

        });
        setFullTank(3);
      }
    }
  };

  useEffect(() => {
    // Fetch the remaining clicks from Firestore when the component mounts
    const fetchRemainingClicks = async () => {
      if (id) {
        const userRef = doc(db, 'telegramUsers', id.toString());
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFreeGuru(userData.freeGuru || 0);
          setFullTank(userData.fullTank || 0);
        }
      }
    };

    fetchRemainingClicks();
  }, [id]);


  useEffect(() => {
    const telegramUsername =
      window.Telegram.WebApp.initDataUnsafe?.user?.username;
    const telegramUserid = window.Telegram.WebApp.initDataUnsafe?.user?.id;

    if (telegramUsername) {
      setUsername(telegramUsername);
    }
    if (telegramUserid) {
      setIdme(telegramUserid);
    }

    // Fetch total count from Firestore
    // fetchTotalCountFromFirestore().then((totalCount) => {
    //   setTotalCount(totalCount);
    //   const divided = calculateDividedCount(totalCount);
    //   setDividedCount(divided);
    // });

    //fetchAllUsers(); // Fetch all users when the component mounts
    fetchLeaderboard(); //Fetch fetchLeaderboard
    fetchTotalUserFromFirestore();
    fetchTotalCountFromFirestore();
  }, []);

  const fetchTotalCountFromFirestore = async () => {
    try {
      const userRef = collection(db, "telegramUsers");
      const snapshot = await getAggregateFromServer(userRef, {totalCount: sum('balance')});
      const totalCountRes = snapshot.data().totalCount;
      setTotalCount(totalCountRes);
      const divided = calculateDividedCount(totalCountRes);
      setDividedCount(divided);

    } catch (e) {
      console.error("Error fetching documents: ", e);
      setTotalCount(10009094055959);
    }
  };

  const fetchTotalUserFromFirestore = async () => {
    try {
      const userRef = collection(db, "telegramUsers");
      const snapshot = await getCountFromServer(userRef);
      const totalCountUser = snapshot.data().count; 
      setUsers(totalCountUser)
      setDividedUsers(Math.round(totalCountUser / 2) + Math.round(totalCountUser / 6));
    } catch (e) {
      console.error("Error fetching documents: ", e);
      setUsers(15967)
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const userRef = collection(db, "telegramUsers");
      const q = query(userRef, orderBy("balance", "desc"), limit(100));
      const querySnapshot = await getDocs(q);
  
      const leaderboardUsers = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const userId = data.userId;
        const username = data.username;
        const balance = data.balance;
        const refBonus = data.refBonus || 0;  // Retrieve each user's refBonus
        const photo_url = data.photo_url;
  
        leaderboardUsers.push({ userId, username, balance, refBonus, photo_url });
      });
  
      SetLeaderboard(leaderboardUsers);
  
      // Optionally, set the rank of the current user
      const telegramUserid = window.Telegram.WebApp.initDataUnsafe?.user?.id;
      if (telegramUserid) {
        const targetUserIndex = leaderboardUsers.findIndex((user) => user.userId.toString() === telegramUserid.toString());
        setRankUser(targetUserIndex + 1);
      }
  
    } catch (e) {
      console.error("Error fetching documents: ", e);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const userRef = collection(db, "telegramUsers");
      const querySnapshot = await getDocs(userRef);
      const allUsers = [];
      const uniqueUsernames = new Set(); // Using a Set to store unique usernames

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const username = data.username;
        const firstName = data.firstName;
        const refereeId = data.refereeId;
        const balance = data.balance;

        // Check if the username is unique, if yes, add it to the allUsers array and set
        // a flag indicating that it has been added
        if (!uniqueUsernames.has(username)) {
          allUsers.push({ username, firstName, refereeId, balance });
          uniqueUsernames.add(username);
        }
      });

      setUsers(allUsers.length);
      setDividedUsers(allUsers.length / 2);
      setLoading(false); // Set loading to false once data is fetched
      // Update the count of unique users
    } catch (error) {
      console.error("Error fetching users: ", error);
      setLoading(false); // Set loading to false if there's an error
    }
  };

  const calculateDividedCount = (count) => {
    return count / 4;
  };

  
  // Call this function when appropriate, such as on component mount or before handleClick
  useEffect(() => {
    if (id) {
   checkAndUpdateFreeGuru();
   checkAndUpdateFullTank();
    }
      // eslint-disable-next-line
  }, [id]);




  useEffect(() => {
    if (id) {
      updateUserLevel(id, tapBalance);
    
    }
      // eslint-disable-next-line
  }, [tapBalance, id]);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 3000);
  }, []);

  useEffect(() => {
    fetchReferrals();
  }, []);

  async function createPlinkoSession() {
    try {
      if (!id) throw new Error("User not logged in.");
      
      // Use 'telegramUsers' instead of 'users'
      const sessionsColl = collection(db, "telegramUsers", id, "plinkoSessions");
      const sessionDoc = await addDoc(sessionsColl, {
        userId: id,
        initialBalance: balance,
        netProfit: 0,
        active: true,
        createdAt: serverTimestamp()
      });
  
      return sessionDoc.id; 
    } catch (err) {
      console.error("Error creating plinko session:", err);
      throw err;
    }
  }

// 2) End a Plinko session with netProfit
async function endPlinkoSession(sessionId, netProfit) {
  try {
    if (!id) throw new Error("User not logged in.");

    // Mark session doc inactive
    const sessionRef = doc(db, "telegramUsers", id, "plinkoSessions", sessionId);
    await updateDoc(sessionRef, {
      netProfit,
      active: false
    });

    // Update user’s main balance
    const updatedBalance = balance + netProfit;
    await updateDoc(doc(db, "telegramUsers", id), {
      balance: updatedBalance
    });

    // Also update local state
    setBalance(updatedBalance);

    console.log("endPlinkoSession complete. New balance:", updatedBalance);
  } catch (err) {
    console.error("Error ending plinko session:", err);
    throw err;
  }
}

  return (
    <UserContext.Provider value={{
      balance,
      battery,
      botLevel,
      setBotLevel,
      unsavedEarnings,
      freeGuru,
      fullTank,
      taskCompleted,
      setTaskCompleted,
      taskCompleted2,
      setTaskCompleted2,
      setFullTank, 
      timeStaTank,
      setTimeStaTank,
      timeSta,
      timeSpin,
      setTimeSpin,
      timeDailyReward,
      setTimeDailyReward,
      dailyReward,
      setDailyReward,
      setFreeGuru,
      time,
      setTime,
      startTimer,
      tapGuru,
      setTapGuru,
      mainTap,
      setMainTap,
      timeRefill,
      setTimeRefill,
      refiller,
      setRefiller,
      count,
      setCount,
      isRefilling,
      setIsRefilling,
      refillIntervalRef,
      setBattery,
      refillEnergy,
      tapValue,
      setTapValue,
      tapBalance,
      setTapBalance,
      level,
      energy,
      setEnergy,
      setBalance,
      setLevel,
      loading,
      setLoading,
      id,
      setId,
      sendUserData,
      initialized,
      setInitialized,
      refBonus,
      SetRefBonus,
      manualTasks,
      setManualTasks,
      userManualTasks,
      setUserManualTasks,
      tasks,
      setTasks,
      completedTasks,
      setCompletedTasks,
      claimedMilestones,
      setClaimedMilestones,
      referrals,
      claimedReferralRewards,
      setClaimedReferralRewards,
      idme,
      setIdme,
      totalCount,
      setTotalCount,
      dividedCount,
      setDividedCount,
      users,
      setUsers,
      dividedUsers,
      setDividedUsers,
      username,
      setUsername,
      openInfoTwo,
      setOpenInfoTwo,
      leaderboard,
      rankUser,
      createPlinkoSession,
    endPlinkoSession
      }}>
      {children}
    </UserContext.Provider>
  );
};
