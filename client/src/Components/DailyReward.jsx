import React, { useEffect, useState } from "react";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase.jsx";
import { useUser } from "../context/userContext.jsx";
import { IoCheckmarkCircle } from "react-icons/io5";
import congratspic from "../images/celebrate.gif";
import Animate from "../Components/Animate.jsx";
import coinsmall from "../images/coinsmall.webp";
import BouncingCoins from "../Components/BouncingCoins.jsx";

const listDailyRewards = [
  { title: "Day 1", bonusAward: 1000 },
  { title: "Day 2", bonusAward: 10000 },
  { title: "Day 3", bonusAward: 25000 },
  { title: "Day 4", bonusAward: 50000 },
  { title: "Day 5", bonusAward: 100000 },
  { title: "Day 6", bonusAward: 300000 },
  { title: "Day 7", bonusAward: 500000 },
  { title: "Day 8", bonusAward: 500000 },
  { title: "Day 9", bonusAward: 500000 },
  { title: "Day 10", bonusAward: 500000 },
];

const DailyReward = () => {
  const {
    balance,
    setBalance,
    id,
    timeDailyReward,
    setTimeDailyReward,
    dailyReward,
    setDailyReward,
  } = useUser();
  const [congrats, setCongrats] = useState(false);

  const handleClaim = async () => {
    if (checkClaimable()) {
      const newBalance =
        balance + Number(listDailyRewards[dailyReward].bonusAward);
      try {
        const userRef = doc(db, "telegramUsers", id);
        await updateDoc(userRef, {
          balance: newBalance,
          timeDailyReward: new Date(),
          dailyReward: dailyReward + 1,
        });
        setBalance(newBalance);
        setDailyReward(dailyReward + 1);
        setTimeDailyReward(new Date());

        setCongrats(true);

        setTimeout(() => {
          setCongrats(false);
        }, 4000);
      } catch (error) {
        console.error("Error claiming reward:", error);
      }
    }
  };

  const checkClaimable = () => {
    if (timeDailyReward === null) return true;
    let now = new Date();
    const converTimeDaily = new Date(
      timeDailyReward.seconds * 1000 + timeDailyReward.nanoseconds / 1000000
    );
    let nexDay = converTimeDaily.getTime() + 24 * 60 * 60 * 1000;
    return now > nexDay;
  };

  const rewardFormatter = (num) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1).replace(/\.0$/, "") + "G";
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return num;
  };

  useEffect(() => {
    window.Telegram.WebApp.BackButton.show();
    const handleBackButtonClick = () => window.history.back();
    window.Telegram.WebApp.BackButton.onClick(handleBackButtonClick);
    return () => {
      window.Telegram.WebApp.BackButton.offClick(handleBackButtonClick);
      window.Telegram.WebApp.BackButton.hide();
    };
  }, []);

  return (
    <Animate>
      <div className="flex items-center justify-center w-full pt-2 pb-3">
        <h2
          className="slackey-regular text-[24px] font-bold text-center"
          style={{
            textShadow: "2px 2px 4px rgba(0, 0, 0, 0.4)", // Mobile-friendly text shadow
            color: "#FFD700", // Gold color for a nice effect
          }}
        >
          Check Mianus
        </h2>
      </div>
      <div className="w-full pb-[40px] relative pt-5">
        <p className="slackey-regular text-[16px] text-center pb-3">
          Check Mianus Daily Rewards
        </p>
        <div className="grid items-start w-full grid-cols-5 gap-2 px-5 mt-3">
          {listDailyRewards.map((reward, index) => {
            const isClaimable = dailyReward === index && checkClaimable();
            const isClaimed = dailyReward > index;

            return (
              <div
                key={reward.title}
                className={`relative flex flex-col items-center justify-center rounded-lg p-3 transition-all ${
                  isClaimable
                    ? "bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 animate-pulse"
                    : isClaimed
                    ? "bg-gray-400 opacity-50"
                    : "bg-gray-200 opacity-60"
                }`}
              >
                <span className="slackey-regular text-[12px] font-bold">
                  {reward.title}
                </span>
                <div className="flex justify-center items-center w-[28px] h-[28px] rounded-full bg-white shadow-md">
                  <img src={coinsmall} alt="coin" className="w-[20px]" />
                </div>
                <span
                  className={`slackey-regular text-[10px] font-medium ${
                    isClaimed || !isClaimable ? "text-gray-600" : "text-white"
                  }`}
                >
                  {rewardFormatter(reward.bonusAward)}
                </span>
                {isClaimable && (
                  <div className="absolute inset-0 border-[2px] border-yellow-300 rounded-lg"></div>
                )}
              </div>
            );
          })}
        </div>
        <div className="w-full text-center mt-6">
          <button
            disabled={!checkClaimable()}
            onClick={handleClaim}
            className={`slackey-regular text-[14px] px-5 py-3 rounded-full font-semibold transition-all ${
              checkClaimable()
                ? "bg-gradient-to-r from-green-400 to-blue-500 hover:from-blue-500 hover:to-green-400 text-white shadow-lg"
                : "bg-gray-400 text-gray-800"
            }`}
          >
            {checkClaimable() ? "Claim Now" : "Claimed"}
          </button>
        </div>
      </div>
      <BouncingCoins />
      <div className="w-full absolute top-[-35px] left-0 right-0 flex justify-center z-20 pointer-events-none select-none">
        {congrats && (
          <img src={congratspic} alt="congrats" className="w-[80%]" />
        )}
      </div>
      <div
        className={`${
          congrats ? "visible bottom-6" : "invisible bottom-[-10px]"
        } z-[60] ease-in duration-300 w-full fixed left-0 right-0 px-4`}
      >
        <div className="w-full text-[#54d192] flex items-center space-x-2 px-4 bg-[#121620ef] h-[50px] rounded-[8px]">
          <IoCheckmarkCircle size={24} />
          <span className="slackey-regular text-[14px] font-medium">
            Congratulations! You received{" "}
            {listDailyRewards[dailyReward - 1]?.bonusAward} points.
          </span>
        </div>
      </div>
    </Animate>
  );
};

export default DailyReward;
